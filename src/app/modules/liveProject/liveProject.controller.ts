import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./liveProject.constants";
import { LiveProjectService } from "./liveProject.service";

const createLiveProject = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await LiveProjectService.createLiveProjectIntoDB(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Live project created successfully!",
      data: result,
    });
  }
);

const getAllLiveProjects = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await LiveProjectService.getAllLiveProjectsFromDB(
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Live projects fetched successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleLiveProject = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await LiveProjectService.getSingleLiveProjectFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Live project fetched successfully!",
    data: result,
  });
});

const updateLiveProject = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email || "Unknown User";

    const result = await LiveProjectService.updateLiveProjectIntoDB(
      id,
      req.body,
      userId,
      userName
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Live project updated successfully!",
      data: result,
    });
  }
);

const deleteLiveProject = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await LiveProjectService.deleteLiveProjectFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Live project deleted successfully!",
    data: result,
  });
});

const addDailyNote = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const { note } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email || "Unknown User";

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User information is required to add notes",
        data: null,
      });
    }

    const result = await LiveProjectService.addDailyNoteToLiveProject(
      id,
      note,
      userId,
      userName
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Daily note added successfully!",
      data: result,
    });
  }
);

export const LiveProjectController = {
  createLiveProject,
  getAllLiveProjects,
  getSingleLiveProject,
  updateLiveProject,
  deleteLiveProject,
  addDailyNote,
};

