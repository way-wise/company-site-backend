import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import prisma from "../../../shared/prismaClient";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./leave.constants";
import { LeaveService } from "./leave.service";

const applyForLeave = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req.user;

    // Get user profile from user
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!userProfile) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await LeaveService.createLeaveApplication({
      employeeId: userProfile.id, // Maps to userProfileId internally
      leaveTypeId: req.body.leaveTypeId,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason,
      attachmentUrl: req.body.attachmentUrl,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Leave application submitted successfully!",
      data: result,
    });
  }
);

const getMyLeaves = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req.user;

    // Get user profile from user
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!userProfile) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const validQueryParams = filterValidQueryParams(req.query, validParams);
    const paginationAndSortingQueryParams = filterValidQueryParams(
      req.query,
      paginationAndSortingParams
    );

    const result = await LeaveService.getMyLeaveApplications(
      userProfile.id,
      validQueryParams,
      paginationAndSortingQueryParams
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My leave applications fetched successfully!",
      meta: result.meta,
      data: result.result,
    });
  }
);

const getAllLeaves = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await LeaveService.getAllLeaveApplications(
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All leave applications fetched successfully!",
    meta: result.meta,
    data: result.result,
  });
});

const getSingleLeave = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await LeaveService.getSingleLeaveApplication(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Leave application not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leave application fetched successfully!",
    data: result,
  });
});

const approveLeave = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    // Get user profile from user
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!userProfile) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await LeaveService.updateLeaveStatus(id, {
      status: "APPROVED",
      approvedBy: userProfile.id,
      comments: req.body.comments,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave application approved successfully!",
      data: result,
    });
  }
);

const rejectLeave = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    // Get user profile from user
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!userProfile) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await LeaveService.updateLeaveStatus(id, {
      status: "REJECTED",
      approvedBy: userProfile.id,
      rejectionReason: req.body.rejectionReason,
      comments: req.body.comments,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave application rejected successfully!",
      data: result,
    });
  }
);

const deleteLeave = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    // Get user profile from user
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!userProfile) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await LeaveService.deleteLeaveApplication(
      id,
      userProfile.id
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave application deleted successfully!",
      data: result,
    });
  }
);

const cancelLeave = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!userProfile) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await LeaveService.cancelLeaveApplication(
      id,
      user.id // Pass userId instead of userProfileId to check permissions
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Leave application cancelled successfully!",
      data: result,
    });
  }
);

const getLeaveStats = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);

  const result = await LeaveService.getLeaveStats(validQueryParams);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leave statistics fetched successfully!",
    data: result,
  });
});

const getLeaveCalendar = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, [
    "startDate",
    "endDate",
    "userProfileId",
    "leaveTypeId",
  ]);

  const result = await LeaveService.getLeaveCalendar(validQueryParams);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leave calendar fetched successfully!",
    data: result,
  });
});

export const LeaveController = {
  applyForLeave,
  getMyLeaves,
  getAllLeaves,
  getSingleLeave,
  approveLeave,
  rejectLeave,
  deleteLeave,
  cancelLeave,
  getLeaveStats,
  getLeaveCalendar,
};
