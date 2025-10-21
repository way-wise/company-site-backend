import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config/config";
import { jwtHelpers } from "../../helpers/jwtHelper";
import { permissionHelper } from "../../helpers/permissionHelper";
import prisma from "../../shared/prismaClient";
import { HTTPError } from "../errors/HTTPError";

/**
 * Basic authentication guard - just verifies the token
 * For role-based access, use roleGuard
 * For permission-based access, use permissionGuard
 */
const authGuard = () => {
  return async (
    req: Request & { user?: any },
    _res: Response,
    next: NextFunction
  ) => {
    try {
      // Try to get token from cookies first, then fallback to Authorization header
      const token = req.cookies?.accessToken || req.headers.authorization;
      if (!token) {
        throw new HTTPError(httpStatus.UNAUTHORIZED, "You are not authorized");
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );

      // Get user from database to attach full user info including ID
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
      req.user = {
        ...verifiedUser,
        id: user.id,
        roles: user.roles.map((ur) => ur.role),
        userProfile: user.userProfile,
        permissions: await permissionHelper.getUserPermissions(user.id),
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authGuard;
