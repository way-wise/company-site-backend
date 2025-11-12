import { Request, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload, Secret } from "jsonwebtoken";
import { HTTPError } from "../app/errors/HTTPError";
import { authServices } from "../app/modules/auth/auth.services";
import config from "../config/config";
import prisma from "../shared/prismaClient";
import {
  AUTH_COOKIE_KEYS,
  clearAuthCookies,
  setAuthCookies,
} from "../shared/cookieUtils";
import { jwtHelpers } from "./jwtHelper";
import { permissionHelper } from "./permissionHelper";

/**
 * Shared helper to verify JWT token and fetch user from database
 * This eliminates duplicate code across authGuard, roleGuard, and permissionGuard
 */
export const verifyAndFetchUser = async (
  req: Request & { user?: any },
  res: Response
) => {
  const tokens = extractTokens(req);

  if (!tokens.accessToken && !tokens.refreshToken) {
    throw new HTTPError(httpStatus.UNAUTHORIZED, "You are not authorized");
  }

  const verifiedUser = await verifyAccessToken(tokens.accessToken);
  if (verifiedUser) {
    return fetchUserWithPermissions(verifiedUser.email, verifiedUser);
  }

  if (!tokens.refreshToken) {
    throw new HTTPError(
      httpStatus.UNAUTHORIZED,
      "Session expired. Please login again."
    );
  }

  try {
    const newTokens = await authServices.refreshToken(tokens.refreshToken);
    setAuthCookies(res, newTokens);

    const refreshedPayload = jwtHelpers.verifyToken(
      newTokens.accessToken,
      config.jwt.jwt_secret as Secret
    );

    return fetchUserWithPermissions(refreshedPayload.email, refreshedPayload);
  } catch (error) {
    clearAuthCookies(res);
    throw new HTTPError(
      httpStatus.UNAUTHORIZED,
      "Session expired. Please login again."
    );
  }
};

const extractTokens = (req: Request) => {
  const cookies = req.cookies ?? {};
  const accessTokenFromCookie = cookies[AUTH_COOKIE_KEYS.access];
  const refreshTokenFromCookie = cookies[AUTH_COOKIE_KEYS.refresh];

  const authHeader = req.headers.authorization ?? "";
  const accessTokenFromHeader = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader || undefined;

  const accessToken = accessTokenFromCookie ?? accessTokenFromHeader;

  return {
    accessToken,
    refreshToken: refreshTokenFromCookie,
  };
};

const verifyAccessToken = (token?: string): JwtPayload | null => {
  if (!token) {
    return null;
  }

  try {
    return jwtHelpers.verifyToken(token, config.jwt.jwt_secret as Secret);
  } catch (error) {
    const isExpired =
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name?: string }).name === "TokenExpiredError";

    if (isExpired) {
      return null;
    }

    throw new HTTPError(httpStatus.UNAUTHORIZED, "You are not authorized");
  }
};

const fetchUserWithPermissions = async (
  email: string,
  payload?: JwtPayload
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
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

  const permissions = await permissionHelper.getUserPermissions(user.id);

  return {
    ...(payload ?? {}),
    email: user.email,
    id: user.id,
    roles: user.roles.map((ur) => ur.role),
    userProfile: user.userProfile,
    permissions,
  };
};
