import { NextFunction, Request, Response } from "express";
import { verifyAndFetchUser } from "../../helpers/authHelper";

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
      req.user = await verifyAndFetchUser(req);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authGuard;
