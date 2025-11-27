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

  // For production, use the configured domain to enable cross-subdomain cookies
  // For development, don't set domain (cookies work on localhost)
  const cookieConfig: {
    secure: boolean;
    sameSite: CookieSameSiteOption;
    httpOnly: boolean;
    path: string;
    domain?: string;
  } = {
    secure,
    sameSite,
    httpOnly: true,
    path: "/", // Explicit path to ensure cookies are accessible across all routes
  };

  // Set domain for production to enable cross-subdomain cookie sharing
  if (isProduction && config.cookie_domain) {
    cookieConfig.domain = config.cookie_domain;
  }

  return cookieConfig;
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
  const accessOptions = getAccessTokenCookieOptions();
  const refreshOptions = getRefreshTokenCookieOptions();

  // Debug logging for production troubleshooting
  if (config.env === "production") {
    console.log("[Cookie Setting]", {
      accessTokenLength: tokens.accessToken?.length,
      hasRefreshToken: !!tokens.refreshToken,
      cookieConfig: {
        domain: accessOptions.domain,
        secure: accessOptions.secure,
        sameSite: accessOptions.sameSite,
        path: accessOptions.path,
      },
    });
  }

  res.cookie(AUTH_COOKIE_KEYS.access, tokens.accessToken, accessOptions);

  if (tokens.refreshToken) {
    res.cookie(AUTH_COOKIE_KEYS.refresh, tokens.refreshToken, refreshOptions);
  }
};

export const clearAuthCookies = (res: Response) => {
  const baseOptions = getEnvironmentCookieConfig();
  res.clearCookie(AUTH_COOKIE_KEYS.access, baseOptions);
  res.clearCookie(AUTH_COOKIE_KEYS.refresh, baseOptions);

  // Also clear with domain explicitly set to ensure cleanup across subdomains
  if (config.cookie_domain) {
    res.clearCookie(AUTH_COOKIE_KEYS.access, {
      ...baseOptions,
      domain: config.cookie_domain,
    });
    res.clearCookie(AUTH_COOKIE_KEYS.refresh, {
      ...baseOptions,
      domain: config.cookie_domain,
    });
  }
};
