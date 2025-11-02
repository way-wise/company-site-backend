import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import { LeaveTypeService } from "./leaveType.service";
import { validParams } from "./leaveType.constants";

const createLeaveType = catchAsync(
  async (req: Request, res: Response) => {
    const result = await LeaveTypeService.createLeaveType(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Leave type created successfully!",
      data: result,
    });
  }
);

const getAllLeaveTypes = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await LeaveTypeService.getAllLeaveTypes(
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leave types fetched successfully!",
    meta: result.meta,
    data: result.result,
  });
});

const getActiveLeaveTypes = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await LeaveTypeService.getActiveLeaveTypes();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Active leave types fetched successfully!",
      data: result,
    });
  }
);

const getSingleLeaveType = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await LeaveTypeService.getSingleLeaveType(id);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "Leave type not found",
        data: null,
      });
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave type fetched successfully!",
      data: result,
    });
  }
);

const updateLeaveType = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await LeaveTypeService.updateLeaveType(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave type updated successfully!",
      data: result,
    });
  }
);

const deleteLeaveType = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await LeaveTypeService.deleteLeaveType(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave type deleted successfully!",
      data: result,
    });
  }
);

const toggleLeaveTypeStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await LeaveTypeService.toggleLeaveTypeStatus(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Leave type ${result.isActive ? "activated" : "deactivated"} successfully!`,
      data: result,
    });
  }
);

export const LeaveTypeController = {
  createLeaveType,
  getAllLeaveTypes,
  getActiveLeaveTypes,
  getSingleLeaveType,
  updateLeaveType,
  deleteLeaveType,
  toggleLeaveTypeStatus,
};

