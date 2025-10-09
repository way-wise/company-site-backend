import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config/config";
import { jwtHelpers } from "../../helpers/jwtHelper";
import { permissionHelper } from "../../helpers/permissionHelper";
import prisma from "../../shared/prismaClient";
import { HTTPError } from "../errors/HTTPError";

/**
 * Middleware to check if user has required roles
 * @param roles - Array of role names required (user needs ANY of these)
 */
const roleGuard = (...roles: string[]) => {
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

      // Verify token
      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );

      // Get user from database to get the user ID
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: verifiedUser.email },
      });

      // Check if user has any of the required roles
      if (roles.length > 0) {
        const hasRequiredRole = await permissionHelper.hasAnyRole(
          user.id,
          roles
        );

        if (!hasRequiredRole) {
          throw new HTTPError(
            httpStatus.FORBIDDEN,
            "You don't have the required role to perform this action"
          );
        }
      }

      req.user = { ...verifiedUser, id: user.id };
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default roleGuard;
