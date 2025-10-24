import { UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import fs from "fs";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import path from "path";
import config from "../../../config/config";
import { jwtHelpers } from "../../../helpers/jwtHelper";
import prisma from "../../../shared/prismaClient";
import { HTTPError } from "../../errors/HTTPError";
import { VerifiedUser } from "../../interfaces/common";
import emailSender from "./emailSender";

const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new HTTPError(
      httpStatus.UNAUTHORIZED,
      "Invalid email or password. Please check your credentials and try again."
    );
  }

  const accessToken = jwtHelpers.generateToken(
    {
      email: userData.email,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      email: userData.email,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  // Calculate token expiration time (in seconds since epoch)
  const expiresIn = config.jwt.expires_in as string;
  const expirationMatch = expiresIn.match(/(\d+)([smhd])/);
  let expiresAt = Math.floor(Date.now() / 1000); // Current time in seconds

  if (expirationMatch) {
    const value = parseInt(expirationMatch[1]);
    const unit = expirationMatch[2];

    switch (unit) {
      case "s":
        expiresAt += value;
        break;
      case "m":
        expiresAt += value * 60;
        break;
      case "h":
        expiresAt += value * 60 * 60;
        break;
      case "d":
        expiresAt += value * 24 * 60 * 60;
        break;
    }
  }

  // Store tokens in database
  await prisma.user.update({
    where: { id: userData.id },
    data: {
      accessToken,
      refreshToken,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    passwordChangeRequired: userData.isPasswordChangeRequired,
  };
};

const refreshToken = async (token: string) => {
  // Check if refresh token exists
  if (!token) {
    throw new HTTPError(
      httpStatus.UNAUTHORIZED,
      "Refresh token not provided. Please login again."
    );
  }

  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_token_secret as Secret
    );
  } catch (err) {
    throw new HTTPError(
      httpStatus.UNAUTHORIZED,
      "Invalid refresh token. Please login again."
    );
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData.email,
      status: UserStatus.ACTIVE,
    },
  });

  // Validate that the refresh token matches the one stored in database
  if (userData.refreshToken !== token) {
    throw new HTTPError(
      httpStatus.UNAUTHORIZED,
      "Invalid refresh token. Please login again."
    );
  }

  const accessToken = jwtHelpers.generateToken(
    {
      email: userData.email,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  // Calculate new token expiration time
  const expiresIn = config.jwt.expires_in as string;
  const expirationMatch = expiresIn.match(/(\d+)([smhd])/);
  let expiresAt = Math.floor(Date.now() / 1000);

  if (expirationMatch) {
    const value = parseInt(expirationMatch[1]);
    const unit = expirationMatch[2];

    switch (unit) {
      case "s":
        expiresAt += value;
        break;
      case "m":
        expiresAt += value * 60;
        break;
      case "h":
        expiresAt += value * 60 * 60;
        break;
      case "d":
        expiresAt += value * 24 * 60 * 60;
        break;
    }
  }

  // Update access token and expiration in database
  await prisma.user.update({
    where: { id: userData.id },
    data: {
      accessToken,
      expiresAt,
    },
  });

  return {
    accessToken,
    passwordChangeRequired: userData.isPasswordChangeRequired,
  };
};

const changePassword = async (user: VerifiedUser, payload: any) => {
  //@ checking if the user exist
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
      status: UserStatus.ACTIVE,
    },
  });

  //@ checking if the provided old password is correct
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.oldPassword,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new Error("Password is incorrect!");
  }

  //@ hashing the new password
  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

  //@ updating the password and also changing the isPasswordChangeRequired to false
  await prisma.user.update({
    where: {
      email: userData.email,
    },
    data: {
      password: hashedPassword,
      isPasswordChangeRequired: false,
    },
  });

  return {
    message: "Password change successfully",
  };
};

const forgotPassword = async ({ email }: { email: string }) => {
  //@ checking if the user exist
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: email,
      status: UserStatus.ACTIVE,
    },
  });

  //@ creating a short time token
  const resetPasswordToken = jwtHelpers.generateToken(
    {
      email: userData.email,
    },
    config.jwt.reset_password_token_secret as Secret,
    config.jwt.reset_token_expires_in as string
  );

  //@ generating a link to send via email
  let link = `${config.reset_pass_link}?userId=${userData.id}&token=${resetPasswordToken}`;

  //@ read HTML template file
  const htmlFilePath = path.join(
    process.cwd(),
    "/src/templates/reset_pass_template.html"
  );

  const htmlTemplate = fs.readFileSync(htmlFilePath, "utf8");
  const htmlContent = htmlTemplate.replace("{{resetPasswordLink}}", link);

  await emailSender(userData.email, htmlContent);
};

const resetPassword = async (
  token: string,
  payload: { id: string; password: string }
) => {
  //@ checking if the user exist
  await prisma.user.findUniqueOrThrow({
    where: {
      id: payload.id,
      status: UserStatus.ACTIVE,
    },
  });

  //@ verifying token
  const isValidToken = jwtHelpers.verifyToken(
    token,
    config.jwt.reset_password_token_secret as Secret
  );

  if (!isValidToken) {
    throw new HTTPError(httpStatus.FORBIDDEN, "Invalid Token");
  }

  //@ hashing the new password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  //@ updating the password and also changing the passwordChangeRequired to false
  await prisma.user.update({
    where: {
      id: payload.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: "Password changed successfully",
  };
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

  // Remove sensitive data
  const { password, accessToken, refreshToken, ...userWithoutPassword } =
    userData;

  return userWithoutPassword;
};

const logout = async (user: VerifiedUser) => {
  // Clear tokens from database
  await prisma.user.update({
    where: {
      email: user.email,
      status: UserStatus.ACTIVE,
    },
    data: {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    },
  });

  return {
    message: "Logged out successfully",
  };
};

export const authServices = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
};
