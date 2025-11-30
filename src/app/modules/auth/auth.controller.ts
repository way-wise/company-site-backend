import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { clearAuthCookies, setAuthCookies } from "../../../shared/cookieUtils";
import { sendResponse } from "../../../shared/sendResponse";
import { authServices } from "./auth.services";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.loginUser(req.body);
  const { refreshToken, accessToken, user } = result;

  setAuthCookies(res, { accessToken, refreshToken });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully!",
    data: { user },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const result = await authServices.refreshToken(refreshToken);

  setAuthCookies(res, result);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token generated successfully!",
    data: null,
  });
});

const getMe = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    console.log("getMe", req.user);
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

    clearAuthCookies(res);

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
