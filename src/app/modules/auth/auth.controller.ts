import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config/config";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { authServices } from "./auth.services";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.loginUser(req.body);
  const { refreshToken, accessToken, email } = result;

  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: (config.env === "production" ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.cookie("accessToken", accessToken, cookieOptions);

  const userData = await authServices.getMe({ email } as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully!",
    data: { user: userData },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const result = await authServices.refreshToken(refreshToken);

  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: (config.env === "production" ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };

  res.cookie("accessToken", result.accessToken, cookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token generated successfully!",
    data: null,
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
    await authServices.logout(user);

    const cookieOptions = {
      secure: config.env === "production",
      httpOnly: true,
      sameSite: (config.env === "production" ? "none" : "lax") as
        | "none"
        | "lax",
      path: "/",
    };

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
  getMe,
  logout,
};
