// import { Response } from "express";

// const getCookieOptions = () => ({
//   secure: false,
//   httpOnly: true,
// });

// export const AUTH_COOKIE_KEYS = {
//   access: "accessToken",
//   refresh: "refreshToken",
// } as const;

// export const setAuthCookies = (
//   res: Response,
//   tokens: { accessToken: string; refreshToken?: string }
// ) => {
//   const options = getCookieOptions();

//   res.cookie(AUTH_COOKIE_KEYS.access, tokens.accessToken, options);

//   if (tokens.refreshToken) {
//     res.cookie(AUTH_COOKIE_KEYS.refresh, tokens.refreshToken, options);
//   }
// };

// export const clearAuthCookies = (res: Response) => {
//   const options = getCookieOptions();
//   res.clearCookie(AUTH_COOKIE_KEYS.access, options);
//   res.clearCookie(AUTH_COOKIE_KEYS.refresh, options);
// };
import { Response } from "express";
import config from "../config/config";

const getCookieOptions = () => {
  const isProduction = config.env === "production";

  return {
    secure: isProduction, // Production এ true, development এ false
    httpOnly: true,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    domain: isProduction ? config.cookie_domain : undefined, // Production এ .waywisetech.com
    path: "/",
  };
};

export const AUTH_COOKIE_KEYS = {
  access: "accessToken",
  refresh: "refreshToken",
} as const;

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken?: string }
) => {
  const options = getCookieOptions();

  res.cookie(AUTH_COOKIE_KEYS.access, tokens.accessToken, options);

  if (tokens.refreshToken) {
    res.cookie(AUTH_COOKIE_KEYS.refresh, tokens.refreshToken, options);
  }
};

export const clearAuthCookies = (res: Response) => {
  const options = getCookieOptions();
  res.clearCookie(AUTH_COOKIE_KEYS.access, options);
  res.clearCookie(AUTH_COOKIE_KEYS.refresh, options);
};
