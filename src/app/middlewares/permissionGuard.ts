import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { verifyAndFetchUser } from "../../helpers/authHelper";
import { permissionHelper } from "../../helpers/permissionHelper";
import { HTTPError } from "../errors/HTTPError";

/**
 * Middleware to check if user has required permissions
 * @param permissions - Array of permission names required (user needs ANY of these)
 */
const permissionGuard = (...permissions: string[]) => {
  return async (
    req: Request & { user?: any },
    _res: Response,
    next: NextFunction
  ) => {
    try {
      // Verify token and fetch user (reuses shared logic)
      const user = await verifyAndFetchUser(req);

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

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default permissionGuard;
