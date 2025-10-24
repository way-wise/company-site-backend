import { Request } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import { HTTPError } from "../app/errors/HTTPError";
import config from "../config/config";
import prisma from "../shared/prismaClient";
import { jwtHelpers } from "./jwtHelper";
import { permissionHelper } from "./permissionHelper";

/**
 * Shared helper to verify JWT token and fetch user from database
 * This eliminates duplicate code across authGuard, roleGuard, and permissionGuard
 */
export const verifyAndFetchUser = async (req: Request & { user?: any }) => {
  // Try to get token from cookies first, then fallback to Authorization header
  const token = req.cookies?.accessToken || req.headers.authorization;
  if (!token) {
    throw new HTTPError(httpStatus.UNAUTHORIZED, "You are not authorized");
  }

  // Verify token
  const verifiedUser = jwtHelpers.verifyToken(
    token,
    config.jwt.jwt_secret as Secret
  );

  // Get user from database with all necessary relations
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: verifiedUser.email },
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

  // Attach user with permissions to request
  return {
    ...verifiedUser,
    id: user.id,
    roles: user.roles.map((ur) => ur.role),
    userProfile: user.userProfile,
    permissions: await permissionHelper.getUserPermissions(user.id),
  };
};
