import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config/config";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { authServices } from "./auth.services";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.loginUser(req.body);

  const { refreshToken, accessToken } = result;

  // Set refresh token cookie
  res.cookie("refreshToken", refreshToken, {
    secure: config.env === "production", // Use secure cookies in production
    httpOnly: true,
    sameSite: config.env === "production" ? "none" : "lax", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: config.env === "production" ? undefined : undefined, // Let browser handle domain
    path: "/", // Explicitly set path
  });

  // Set access token cookie
  res.cookie("accessToken", accessToken, {
    secure: config.env === "production", // Use secure cookies in production
    httpOnly: true,
    sameSite: config.env === "production" ? "none" : "lax", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: config.env === "production" ? undefined : undefined, // Let browser handle domain
    path: "/", // Explicitly set path
  });

  // Get user data to include in response (for debugging and fallback)
  const userData = await authServices.getMe({
    email: result.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully!",
    data: {
      passwordChangeRequired: result.passwordChangeRequired,
      user: userData, // Include user data in response
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  const result = await authServices.refreshToken(refreshToken);

  // Set new access token cookie
  res.cookie("accessToken", result.accessToken, {
    secure: config.env === "production", // Use secure cookies in production
    httpOnly: true,
    sameSite: config.env === "production" ? "none" : "lax", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: config.env === "production" ? undefined : undefined, // Let browser handle domain
    path: "/", // Explicitly set path
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token generated successfully!",
    data: null,
  });
});

const changePassword = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req.user;
    const payload = req.body;

    const result = await authServices.changePassword(user, payload);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password changed successfully!",
      data: result,
    });
  }
);

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email to reset your password",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization || "";

  const result = await authServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully!",
    data: result,
  });
});

const getMe = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req.user;

    const result = await authServices.getMe(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User profile retrieved successfully!",
      data: result,
    });
  }
);

const logout = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req.user;

    // Clear tokens from database
    await authServices.logout(user);

    // Clear both access and refresh token cookies
    res.clearCookie("accessToken", {
      secure: config.env === "production",
      httpOnly: true,
      sameSite: config.env === "production" ? "none" : "lax",
      domain: config.env === "production" ? undefined : undefined,
      path: "/",
    });

    res.clearCookie("refreshToken", {
      secure: config.env === "production",
      httpOnly: true,
      sameSite: config.env === "production" ? "none" : "lax",
      domain: config.env === "production" ? undefined : undefined,
      path: "/",
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Logged out successfully!",
      data: null,
    });
  }
);

export const authController = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
};
