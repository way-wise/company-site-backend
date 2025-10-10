import { Request, Response } from "express";

import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./user.constant";
import { userService } from "./user.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await userService.getAllUsers(
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin data fetched!",
    data: result,
  });
});
const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await userService.getSingleUserFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User data fetched successfully!",
    data: result,
  });
});
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

const createEmployee = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createEmployee(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Employee Created Successfully!",
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userData = req.body;

  const result = await userService.updateUser(id, userData);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully!",
    data: result,
  });
});

const banUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { banReason } = req.body;

  const result = await userService.banUser(id, banReason);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User banned successfully!",
    data: result,
  });
});

const unbanUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await userService.unbanUser(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User unbanned successfully!",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await userService.deleteUser(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully!",
    data: result,
  });
});

const getUsersByRole = catchAsync(async (req: Request, res: Response) => {
  const { roleId } = req.params;
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await userService.getUsersByRole(
    roleId,
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users with role fetched successfully!",
    data: result,
  });
});

export const userController = {
  createAdmin,
  createClient,
  createEmployee,
  getAllUsers,
  getSingleUser,
  updateUser,
  banUser,
  unbanUser,
  deleteUser,
  getUsersByRole,
};
