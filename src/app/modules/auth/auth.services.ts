import { Gender, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config/config";
import { jwtHelpers } from "../../../helpers/jwtHelper";
import prisma from "../../../shared/prismaClient";
import { HTTPError } from "../../errors/HTTPError";
import { VerifiedUser } from "../../interfaces/common";

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

export const authServices = {
  loginUser,
  registerUser,
  refreshToken,
  getMe,
  logout,
};
