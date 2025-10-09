import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { roleService } from "./role.service";

const getAllRoles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const queryParams = filterValidQueryParams(req.query, ["q", "name"]);
    const paginationAndSortingQueryParams = filterValidQueryParams(
      req.query,
      paginationAndSortingParams
    );

    const result = await roleService.getAllRoles(
      queryParams,
      paginationAndSortingQueryParams
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Roles retrieved successfully",
      meta: result.meta,
      data: result.result,
    });
  }
);

const getSingleRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await roleService.getSingleRole(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Role retrieved successfully",
      data: result,
    });
  }
);

const createRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await roleService.createRole(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Role created successfully",
      data: result,
    });
  }
);

const updateRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await roleService.updateRole(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Role updated successfully",
      data: result,
    });
  }
);

const deleteRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await roleService.deleteRole(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
);

const assignPermissionsToRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await roleService.assignPermissionsToRole(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
);

const removePermissionFromRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { roleId, permissionId } = req.params;
    const result = await roleService.removePermissionFromRole(
      roleId,
      permissionId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
);

const assignRoleToUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await roleService.assignRoleToUser(req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
);

const removeRoleFromUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await roleService.removeRoleFromUser(req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
);

const getUserRoles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const result = await roleService.getUserRoles(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User roles retrieved successfully",
      data: result,
    });
  }
);

const getUserPermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const result = await roleService.getUserPermissions(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User permissions retrieved successfully",
      data: result,
    });
  }
);

export const roleController = {
  getAllRoles,
  getSingleRole,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
  removePermissionFromRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  getUserPermissions,
};
