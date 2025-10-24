import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config/config";
import { jwtHelpers } from "../../helpers/jwtHelper";
import { permissionHelper } from "../../helpers/permissionHelper";
import prisma from "../../shared/prismaClient";
import { HTTPError } from "../errors/HTTPError";

/**

 * @param permissions - Array of permission names required (user needs ANY of these)
 */
const permissionGuard = (...permissions: string[]) => {
  return async (
    req: Request & { user?: any },
    _res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.cookies?.accessToken || req.headers.authorization;
      if (!token) {
        throw new HTTPError(httpStatus.UNAUTHORIZED, "You are not authorized");
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );

      const user = await prisma.user.findUniqueOrThrow({
        where: { email: verifiedUser.email },
      });

      // Check if user has any of the required permissions
      if (permissions.length > 0) {
        const hasRequiredPermission = await permissionHelper.hasAnyPermission(
          user.id,
          permissions
        );

        if (!hasRequiredPermission) {
          throw new HTTPError(
            httpStatus.FORBIDDEN,
            "You don't have permission to perform this action"
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

export default permissionGuard;
