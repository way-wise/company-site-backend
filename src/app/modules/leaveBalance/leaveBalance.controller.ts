import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import { LeaveBalanceService } from "./leaveBalance.service";
import { validParams } from "./leaveBalance.constants";

const createLeaveBalance = catchAsync(
  async (req: Request, res: Response) => {
    const result = await LeaveBalanceService.createLeaveBalance(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Leave balance created successfully!",
      data: result,
    });
  }
);

const getAllLeaveBalances = catchAsync(
  async (req: Request, res: Response) => {
    const validQueryParams = filterValidQueryParams(req.query, validParams);
    const paginationAndSortingQueryParams = filterValidQueryParams(
      req.query,
      paginationAndSortingParams
    );

    const result = await LeaveBalanceService.getAllLeaveBalances(
      validQueryParams,
      paginationAndSortingQueryParams
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave balances fetched successfully!",
      meta: result.meta,
      data: result.result,
    });
  }
);

const getUserLeaveBalances = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { year } = req.query;

    const result = await LeaveBalanceService.getUserLeaveBalances(
      id,
      year ? parseInt(year as string) : undefined
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User leave balances fetched successfully!",
      data: result,
    });
  }
);

const getSingleLeaveBalance = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await LeaveBalanceService.getSingleLeaveBalance(id);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "Leave balance not found",
        data: null,
      });
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave balance fetched successfully!",
      data: result,
    });
  }
);

const updateLeaveBalance = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await LeaveBalanceService.updateLeaveBalance(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave balance updated successfully!",
      data: result,
    });
  }
);

const deleteLeaveBalance = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await LeaveBalanceService.deleteLeaveBalance(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave balance deleted successfully!",
      data: result,
    });
  }
);

const allocateAnnualBalance = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { year } = req.body;

    const result = await LeaveBalanceService.allocateAnnualBalance(
      id,
      year || new Date().getFullYear()
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Annual leave balance allocated successfully!",
      data: result,
    });
  }
);

export const LeaveBalanceController = {
  createLeaveBalance,
  getAllLeaveBalances,
  getUserLeaveBalances,
  getSingleLeaveBalance,
  updateLeaveBalance,
  deleteLeaveBalance,
  allocateAnnualBalance,
};

