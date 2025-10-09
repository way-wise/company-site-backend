import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { permissionService } from "./permission.service";

const getAllPermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const queryParams = filterValidQueryParams(req.query, [
      "q",
      "name",
      "group",
    ]);
    const paginationAndSortingQueryParams = filterValidQueryParams(
      req.query,
      paginationAndSortingParams
    );

    const result = await permissionService.getAllPermissions(
      queryParams,
      paginationAndSortingQueryParams
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Permissions retrieved successfully",
      meta: result.meta,
      data: result.result,
    });
  }
);

const getSinglePermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await permissionService.getSinglePermission(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Permission retrieved successfully",
      data: result,
    });
  }
);

const createPermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await permissionService.createPermission(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Permission created successfully",
      data: result,
    });
  }
);

const updatePermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await permissionService.updatePermission(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Permission updated successfully",
      data: result,
    });
  }
);

const deletePermission = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await permissionService.deletePermission(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
);

const getPermissionGroups = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await permissionService.getPermissionGroups();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Permission groups retrieved successfully",
      data: result,
    });
  }
);

export const permissionController = {
  getAllPermissions,
  getSinglePermission,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionGroups,
};
