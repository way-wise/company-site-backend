import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./milestone.constants";
import { MilestoneService } from "./milestone.service";

const createMilestone = catchAsync(async (req: Request, res: Response) => {
  const result = await MilestoneService.createMilestoneIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Milestone created successfully!",
    data: result,
  });
});

const getAllMilestones = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await MilestoneService.getAllMilestonesFromDB(
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Milestones fetched successfully!",
    data: result,
  });
});

const getSingleMilestone = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await MilestoneService.getSingleMilestoneFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Milestone fetched successfully!",
    data: result,
  });
});

const updateMilestone = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await MilestoneService.updateMilestoneIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Milestone updated successfully!",
    data: result,
  });
});

const deleteMilestone = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await MilestoneService.deleteMilestoneFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Milestone deleted successfully!",
    data: result,
  });
});

const assignEmployees = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userProfileIds } = req.body;

  const result = await MilestoneService.assignEmployeesToMilestone(
    id,
    userProfileIds
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employees assigned successfully!",
    data: result,
  });
});

const assignServices = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { serviceIds } = req.body;

  const result = await MilestoneService.assignServicesToMilestone(
    id,
    serviceIds
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Services assigned successfully!",
    data: result,
  });
});

export const MilestoneController = {
  createMilestone,
  getAllMilestones,
  getSingleMilestone,
  updateMilestone,
  deleteMilestone,
  assignEmployees,
  assignServices,
};



