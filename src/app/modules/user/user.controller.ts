import { Request, Response } from "express";

import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { userService } from "./user.service";

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createAdmin(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Admin Created Successfully!",
    data: result,
  });
});

const createClient = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createClient(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Client Created Successfully!",
    data: result,
  });
});

export const userController = {
  createAdmin,
  createClient,
};
