import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./task.constants";
import { TaskService } from "./task.service";

const createTask = catchAsync(async (req: Request, res: Response) => {
  console.log("Received task data:", req.body);
  const result = await TaskService.createTaskIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Task created successfully!",
    data: result,
  });
});

const getAllTasks = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await TaskService.getAllTasksFromDB(
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tasks fetched successfully!",
    data: result,
  });
});

const getSingleTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await TaskService.getSingleTaskFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task fetched successfully!",
    data: result,
  });
});

const updateTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log("Update task request - ID:", id);
  console.log("Update task request - Body:", req.body);

  const result = await TaskService.updateTaskIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task updated successfully!",
    data: result,
  });
});

const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await TaskService.deleteTaskFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task deleted successfully!",
    data: result,
  });
});

const assignEmployees = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userProfileIds, roles } = req.body;

  const result = await TaskService.assignEmployeesToTask(
    id,
    userProfileIds,
    roles
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employees assigned successfully!",
    data: result,
  });
});

const addComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const userProfileId = (req as any).user?.userProfileId;

  if (!userProfileId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "User profile not found",
    });
  }

  const result = await TaskService.addCommentToTask(id, userProfileId, content);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Comment added successfully!",
    data: result,
  });
});

const updateProgress = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { progress } = req.body;

  const result = await TaskService.updateTaskProgress(id, progress);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task progress updated successfully!",
    data: result,
  });
});

const updateTimeTracking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { spentHours } = req.body;

  const result = await TaskService.updateTaskTimeTracking(id, spentHours);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Time tracking updated successfully!",
    data: result,
  });
});

export const TaskController = {
  createTask,
  getAllTasks,
  getSingleTask,
  updateTask,
  deleteTask,
  assignEmployees,
  addComment,
  updateProgress,
  updateTimeTracking,
};
