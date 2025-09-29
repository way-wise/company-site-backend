import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config/config";
import { jwtHelpers } from "../../helpers/jwtHelper";
import { HTTPError } from "../errors/HTTPError";

const authGuard = (...roles: string[]) => {
  return (
    req: Request & { user?: any },
    _res: Response,
    next: NextFunction
  ) => {
    console.log("authGuard", req.headers);
    // Try to get token from cookies first, then fallback to Authorization header
    const token = req.cookies?.accessToken || req.headers.authorization;
    if (!token) {
      throw new HTTPError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    try {
      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );

      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new HTTPError(
          httpStatus.UNAUTHORIZED,
          "You don't have the permission"
        );
      }

      req.user = verifiedUser;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authGuard;
