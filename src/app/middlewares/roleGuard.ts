import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { verifyAndFetchUser } from "../../helpers/authHelper";
import { permissionHelper } from "../../helpers/permissionHelper";
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
      // Verify token and fetch user (reuses shared logic)
      const user = await verifyAndFetchUser(req);

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

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default roleGuard;
