import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config/config";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { authServices } from "./auth.services";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.loginUser(req.body);

  const { refreshToken, accessToken, email } = result;

  // Cookie configuration
  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: (config.env === "production" ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };

  // Set refresh token cookie
  res.cookie("refreshToken", refreshToken, cookieOptions);

  // Set access token cookie
  res.cookie("accessToken", accessToken, cookieOptions);

  // Get user data to include in response
  const userData = await authServices.getMe({ email } as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully!",
    data: {
      passwordChangeRequired: result.passwordChangeRequired,
      user: userData,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  const result = await authServices.refreshToken(refreshToken);

  // Cookie configuration
  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: (config.env === "production" ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };

  // Set new access token cookie
  res.cookie("accessToken", result.accessToken, cookieOptions);

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

    // Cookie configuration for clearing
    const cookieOptions = {
      secure: config.env === "production",
      httpOnly: true,
      sameSite: (config.env === "production" ? "none" : "lax") as
        | "none"
        | "lax",
      path: "/",
    };

    // Clear both access and refresh token cookies
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Logged out successfully!",
      data: null,
    });
  }
);

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.registerUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully!",
    data: result,
  });
});

export const authController = {
  loginUser,
  registerUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
};
