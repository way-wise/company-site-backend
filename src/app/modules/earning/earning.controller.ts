import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./earning.constants";
import { EarningService } from "./earning.service";

const createEarning = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userProfileId = req.user?.userProfile?.id;
  if (!userProfileId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "User profile not found",
      data: null,
    });
  }

  const result = await EarningService.createEarningIntoDB({
    ...req.body,
    createdBy: userProfileId,
  });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Earning created successfully!",
    data: result,
  });
});

const getAllEarnings = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await EarningService.getAllEarningsFromDB(
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Earnings fetched successfully!",
    meta: result.meta,
    data: result,
  });
});

const getSingleEarning = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await EarningService.getSingleEarningFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Earning fetched successfully!",
    data: result,
  });
});

const updateEarning = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await EarningService.updateEarningIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Earning updated successfully!",
    data: result,
  });
});

const deleteEarning = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await EarningService.deleteEarningFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Earning deleted successfully!",
    data: result,
  });
});

const getEarningStats = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const result = await EarningService.getEarningStatsFromDB(
    startDate as string | undefined,
    endDate as string | undefined
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Earning statistics fetched successfully!",
    data: result,
  });
});

const getProjectEarnings = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const result = await EarningService.getProjectEarningsFromMilestones(
    startDate as string | undefined,
    endDate as string | undefined
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project earnings from milestones fetched successfully!",
    data: result,
  });
});

export const EarningController = {
  createEarning,
  getAllEarnings,
  getSingleEarning,
  updateEarning,
  deleteEarning,
  getEarningStats,
  getProjectEarnings,
};

