import { Gender, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import * as path from "path";
import config from "../../../config/config";
import { jwtHelpers } from "../../../helpers/jwtHelper";
import prisma from "../../../shared/prismaClient";
import { HTTPError } from "../../errors/HTTPError";
import { VerifiedUser } from "../../interfaces/common";
import emailSender from "./emailSender";

const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
    include: {
      userProfile: true,
      roles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userData) {
    throw new HTTPError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new HTTPError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  const accessToken = jwtHelpers.generateToken(
    { email: userData.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    { email: userData.email },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  await prisma.user.update({
    where: { id: userData.id },
    data: { refreshToken: hashedRefreshToken },
  });

  const { password, ...userWithoutPassword } = userData;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new HTTPError(httpStatus.UNAUTHORIZED, "Refresh token not provided");
  }

  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_token_secret as Secret
    );
  } catch (err) {
    throw new HTTPError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData.email,
      status: UserStatus.ACTIVE,
    },
  });

  const storedRefreshToken = userData.refreshToken;

  if (!storedRefreshToken) {
    throw new HTTPError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }

  const isRefreshTokenValid = await bcrypt.compare(token, storedRefreshToken);

  if (!isRefreshTokenValid) {
    throw new HTTPError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }

  const accessToken = jwtHelpers.generateToken(
    { email: userData.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const newRefreshToken = jwtHelpers.generateToken(
    { email: userData.email },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

  await prisma.user.update({
    where: { id: userData.id },
    data: { refreshToken: hashedRefreshToken },
  });

  return { accessToken, refreshToken: newRefreshToken };
};

const getMe = async (user: VerifiedUser) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
      status: UserStatus.ACTIVE,
    },
    include: {
      userProfile: true,
      roles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Extract unique permissions from roles (already fetched, no additional query)
  const permissionsMap = new Map<
    string,
    {
      id: string;
      name: string;
      group: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  >();

  userData.roles.forEach((userRole) => {
    userRole.role.rolePermissions.forEach((rp) => {
      if (!permissionsMap.has(rp.permission.id)) {
        permissionsMap.set(rp.permission.id, {
          id: rp.permission.id,
          name: rp.permission.name,
          group: rp.permission.group,
          description: rp.permission.description,
          createdAt: rp.permission.createdAt,
          updatedAt: rp.permission.updatedAt,
        });
      }
    });
  });

  const { password, ...userWithoutPassword } = userData;

  // Add permissions to response
  return {
    ...userWithoutPassword,
    permissions: Array.from(permissionsMap.values()),
  };
};

const logout = async (user: VerifiedUser) => {
  await prisma.user.update({
    where: {
      email: user.email,
      status: UserStatus.ACTIVE,
    },
    data: {
      refreshToken: null,
    },
  });

  return {
    message: "Logged out successfully",
  };
};

const registerUser = async (payload: {
  password: string;
  client: {
    name: string;
    email: string;
    gender: Gender;
  };
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.client.email },
  });

  if (existingUser) {
    throw new HTTPError(
      httpStatus.CONFLICT,
      "User with this email already exists"
    );
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: payload.client.name,
        email: payload.client.email,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        isPasswordChangeRequired: false,
      },
    });

    const clientRole = await tx.role.findUnique({
      where: { name: "CLIENT" },
    });

    if (clientRole) {
      await tx.userRoleAssignment.create({
        data: {
          userId: user.id,
          roleId: clientRole.id,
        },
      });
    }

    await tx.userProfile.create({
      data: {
        userId: user.id,
        gender: payload.client.gender,
      },
    });

    return user;
  });

  const { password: _, ...userWithoutPassword } = result;

  return {
    message: "User registered successfully",
    user: userWithoutPassword,
  };
};

const forgotPassword = async (email: string) => {
  const userData = await prisma.user.findUnique({
    where: {
      email,
      status: UserStatus.ACTIVE,
    },
  });

  // Return generic message to prevent email enumeration
  if (!userData) {
    return {
      message: "If an account with that email exists, a password reset link has been sent.",
    };
  }

  const resetToken = jwtHelpers.generateToken(
    { email: userData.email, id: userData.id },
    config.jwt.reset_password_token_secret as Secret,
    config.jwt.reset_token_expires_in as string || "1h"
  );

  const resetPasswordLink = `${config.reset_pass_link}?token=${resetToken}`;

  // Read and populate the email template
  const templatePath = path.join(process.cwd(), "src/templates/reset_pass_template.html");
  let htmlTemplate = fs.readFileSync(templatePath, "utf-8");
  htmlTemplate = htmlTemplate.replace("{{resetPasswordLink}}", resetPasswordLink);

  await emailSender(userData.email, htmlTemplate, {
    subject: "Password Reset Request",
    senderName: config.company_name || "Way Wise Tech",
  });

  return {
    message: "If an account with that email exists, a password reset link has been sent.",
  };
};

const resetPassword = async (token: string, newPassword: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      config.jwt.reset_password_token_secret as Secret
    );
  } catch (err) {
    throw new HTTPError(httpStatus.BAD_REQUEST, "Invalid or expired reset token");
  }

  const userData = await prisma.user.findUnique({
    where: {
      email: decodedData.email,
      status: UserStatus.ACTIVE,
    },
  });

  if (!userData) {
    throw new HTTPError(httpStatus.NOT_FOUND, "User not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userData.id },
    data: {
      password: hashedPassword,
      isPasswordChangeRequired: false,
    },
  });

  return {
    message: "Password reset successfully",
  };
};

const changePassword = async (
  user: VerifiedUser,
  payload: { currentPassword: string; newPassword: string }
) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: user.email,
      status: UserStatus.ACTIVE,
    },
  });

  if (!userData) {
    throw new HTTPError(httpStatus.NOT_FOUND, "User not found");
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.currentPassword,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new HTTPError(httpStatus.UNAUTHORIZED, "Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 12);

  await prisma.user.update({
    where: { id: userData.id },
    data: {
      password: hashedPassword,
      isPasswordChangeRequired: false,
    },
  });

  return {
    message: "Password changed successfully",
  };
};

export const authServices = {
  loginUser,
  registerUser,
  refreshToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};
