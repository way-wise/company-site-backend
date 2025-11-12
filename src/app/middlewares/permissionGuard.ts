import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { verifyAndFetchUser } from "../../helpers/authHelper";
import { HTTPError } from "../errors/HTTPError";

/**
 * Middleware to check if user has required permissions
 * @param permissions - Array of permission names required (user needs ANY of these)
 */
const permissionGuard = (...permissions: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Verify token and fetch user (already includes permissions)
      const user = await verifyAndFetchUser(req, res);

      // Check if user has any of the required permissions
      // Use permissions already fetched in verifyAndFetchUser to avoid duplicate query
      if (permissions.length > 0) {
        const userPermissions = user.permissions || [];
        const userPermissionsSet = new Set(userPermissions);

        const hasRequiredPermission = permissions.some((permName) =>
          userPermissionsSet.has(permName)
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
