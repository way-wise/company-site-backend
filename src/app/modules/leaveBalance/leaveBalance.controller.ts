import { Request, Response } from "express";
import httpStatus from "http-status";
import { permissionHelper } from "../../../helpers/permissionHelper";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import prisma from "../../../shared/prismaClient";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./leaveBalance.constants";
import { LeaveBalanceService } from "./leaveBalance.service";

const createLeaveBalance = catchAsync(async (req: Request, res: Response) => {
  const result = await LeaveBalanceService.createLeaveBalance(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Leave balance created successfully!",
    data: result,
  });
});

const getAllLeaveBalances = catchAsync(async (req: Request, res: Response) => {
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
});

const getUserLeaveBalances = catchAsync(async (req: Request, res: Response) => {
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
});

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

const updateLeaveBalance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await LeaveBalanceService.updateLeaveBalance(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leave balance updated successfully!",
    data: result,
  });
});

const deleteLeaveBalance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await LeaveBalanceService.deleteLeaveBalance(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leave balance deleted successfully!",
    data: result,
  });
});

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

const getEmployeesLeaveSummary = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req.user;
    const { year } = req.query;
    const yearFilter = year
      ? parseInt(year as string)
      : new Date().getFullYear();

    // Get user profile to determine permissions
    const userProfile = user?.id
      ? await prisma.userProfile.findUnique({
          where: { userId: user.id },
        })
      : null;

    // Get pagination params
    const paginationAndSortingQueryParams = filterValidQueryParams(
      req.query,
      paginationAndSortingParams
    );

    // Determine if user can view all employees or only their own
    // If user has view_team_leaves permission, they can see all
    // Otherwise, only show their own data
    let targetUserProfileId: string | undefined = undefined;

    // Check if user has view_team_leaves permission
    const hasTeamViewPermission = await permissionHelper.hasAnyPermission(
      user.id,
      ["view_team_leaves", "approve_leave"]
    );

    if (!hasTeamViewPermission && userProfile) {
      // User can only see their own data
      targetUserProfileId = userProfile.id;
    }

    const result = await LeaveBalanceService.getEmployeesLeaveSummary(
      yearFilter,
      targetUserProfileId,
      paginationAndSortingQueryParams
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Employee leave summary fetched successfully!",
      meta: result.meta,
      data: result.result,
    });
  }
);

const allocateYearlyLeaveForAll = catchAsync(
  async (req: Request, res: Response) => {
    const { year, totalDays } = req.body;

    const result = await LeaveBalanceService.allocateYearlyLeaveForAllEmployees(
      year,
      totalDays
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Yearly leave allocated successfully! ${result.allocated} new allocations created, ${result.updated} existing allocations updated for ${result.totalEmployees} employees.`,
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
  getEmployeesLeaveSummary,
  allocateYearlyLeaveForAll,
};
