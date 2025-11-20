import { Response } from "express";
import config from "../config/config";

type CookieSameSiteOption = "lax" | "none" | "strict";

const ACCESS_TOKEN_MAX_FALLBACK = 1 * 24 * 60 * 60 * 1000; // 1 days
const REFRESH_TOKEN_MAX_FALLBACK = 7 * 24 * 60 * 60 * 1000; // 7 days

const parseDurationToMs = (duration?: string, fallback?: number): number => {
  if (!duration) {
    return fallback ?? ACCESS_TOKEN_MAX_FALLBACK;
  }

  const numericValue = Number(duration);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  const match = /^(\d+)([smhd])$/i.exec(duration.trim());
  if (!match) {
    return fallback ?? ACCESS_TOKEN_MAX_FALLBACK;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return fallback ?? ACCESS_TOKEN_MAX_FALLBACK;
  }
};

const getEnvironmentCookieConfig = () => {
  const isProduction = config.env === "production";
  const sameSite: CookieSameSiteOption = isProduction ? "none" : "lax";
  const secure = isProduction || sameSite === "none";

  return {
    secure,
    sameSite,
    httpOnly: true,
  } as const;
};

export const AUTH_COOKIE_KEYS = {
  access: "accessToken",
  refresh: "refreshToken",
} as const;

export const getAccessTokenCookieOptions = () => ({
  ...getEnvironmentCookieConfig(),
  maxAge: parseDurationToMs(config.jwt.expires_in, ACCESS_TOKEN_MAX_FALLBACK),
});

export const getRefreshTokenCookieOptions = () => ({
  ...getEnvironmentCookieConfig(),
  maxAge: parseDurationToMs(
    config.jwt.refresh_token_expires_in,
    REFRESH_TOKEN_MAX_FALLBACK
  ),
});

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken?: string }
) => {
  res.cookie(
    AUTH_COOKIE_KEYS.access,
    tokens.accessToken,
    getAccessTokenCookieOptions()
  );

  if (tokens.refreshToken) {
    res.cookie(
      AUTH_COOKIE_KEYS.refresh,
      tokens.refreshToken,
      getRefreshTokenCookieOptions()
    );
  }
};

export const clearAuthCookies = (res: Response) => {
  const baseOptions = getEnvironmentCookieConfig();
  res.clearCookie(AUTH_COOKIE_KEYS.access, baseOptions);
  res.clearCookie(AUTH_COOKIE_KEYS.refresh, baseOptions);
};
