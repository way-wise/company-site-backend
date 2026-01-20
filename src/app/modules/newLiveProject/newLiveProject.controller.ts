import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./newLiveProject.constants";
import { NewLiveProjectService } from "./newLiveProject.service";
import { UploadedFile } from "../../interfaces/file";
import { uploadFileToBlob } from "../../../helpers/blobUploader";
import { IDocument } from "./newLiveProject.interface";

/**
 * Create a new live project
 * POST /api/new-live-projects
 */
const createNewLiveProject = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userProfileId = req.user?.userProfile?.id;

    if (!userProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await NewLiveProjectService.createNewLiveProjectIntoDB({
      ...req.body,
      createdBy: userProfileId,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "New live project created successfully!",
      data: result,
    });
  }
);

/**
 * Get all new live projects with filtering, searching, and pagination
 * GET /api/new-live-projects
 */
const getAllNewLiveProjects = catchAsync(
  async (req: Request, res: Response) => {
    const validQueryParams = filterValidQueryParams(req.query, validParams);
    const paginationAndSortingQueryParams = filterValidQueryParams(
      req.query,
      paginationAndSortingParams
    );

    const result = await NewLiveProjectService.getAllNewLiveProjectsFromDB(
      validQueryParams,
      paginationAndSortingQueryParams
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "New live projects fetched successfully!",
      meta: result.meta,
      data: result.data,
    });
  }
);

/**
 * Get a single new live project by ID
 * GET /api/new-live-projects/:id
 */
const getSingleNewLiveProject = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result =
      await NewLiveProjectService.getSingleNewLiveProjectFromDB(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "New live project fetched successfully!",
      data: result,
    });
  }
);

/**
 * Update a new live project
 * PUT /api/new-live-projects/:id
 */
const updateNewLiveProject = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;

    const result = await NewLiveProjectService.updateNewLiveProjectIntoDB(
      id,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "New live project updated successfully!",
      data: result,
    });
  }
);

/**
 * Soft delete a new live project (set status to ARCHIVED)
 * DELETE /api/new-live-projects/:id
 */
const deleteNewLiveProject = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await NewLiveProjectService.deleteNewLiveProjectFromDB(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "New live project archived successfully!",
      data: result,
    });
  }
);

/**
 * Upload document to a project (append to documents array)
 * POST /api/new-live-projects/:projectId/documents
 */
const uploadDocument = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { projectId } = req.params;
    const userProfileId = req.user?.userProfile?.id;

    if (!userProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const file = req.file as unknown as UploadedFile;

    if (!file) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "No file provided",
        data: null,
      });
    }

    try {
      // Upload file to blob storage
      const uploadResult = await uploadFileToBlob(file, {
        prefix: `new-live-projects/${projectId}`,
      });

      // Create document object
      const document: IDocument = {
        fileName: file.originalname,
        fileUrl: uploadResult.url,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: userProfileId,
        uploadedAt: new Date().toISOString(),
      };

      // Append document to project (never overwrite existing documents)
      const result = await NewLiveProjectService.uploadDocumentToProject(
        projectId,
        document
      );

      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Document uploaded successfully!",
        data: result,
      });
    } catch (error) {
      console.error("Document upload error:", error);
      return sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to upload document",
        data: null,
      });
    }
  }
);

/**
 * Create a project action
 * POST /api/new-live-projects/:projectId/actions
 */
const createProjectAction = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { projectId } = req.params;
    const userProfileId = req.user?.userProfile?.id;

    if (!userProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await NewLiveProjectService.createProjectActionIntoDB({
      projectId,
      actionText: req.body.actionText,
      actionDate: req.body.actionDate,
      createdBy: userProfileId,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Project action created successfully!",
      data: result,
    });
  }
);

/**
 * Get all actions for a project
 * GET /api/new-live-projects/:projectId/actions
 */
const getProjectActions = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const result = await NewLiveProjectService.getProjectActionsFromDB(projectId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project actions fetched successfully!",
    data: result,
  });
});

/**
 * Create an hour log for hourly projects
 * POST /api/new-live-projects/:projectId/hours
 */
const createHourLog = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { projectId } = req.params;
    const userProfileId = req.user?.userProfile?.id;

    if (!userProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await NewLiveProjectService.createHourLogIntoDB({
      projectId,
      userId: userProfileId,
      date: req.body.date,
      submittedHours: req.body.submittedHours,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Hour log created successfully!",
      data: result,
    });
  }
);

/**
 * Get all hour logs for a project
 * GET /api/new-live-projects/:projectId/hours
 */
const getHourLogs = catchAsync(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const result = await NewLiveProjectService.getHourLogsFromDB(projectId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Hour logs fetched successfully!",
    data: result,
  });
});

/**
 * Update an hour log
 * PUT /api/new-live-projects/:projectId/hours/:hourLogId
 */
const updateHourLog = catchAsync(
  async (req: Request, res: Response) => {
    const { hourLogId } = req.params;

    const result = await NewLiveProjectService.updateHourLogIntoDB(
      hourLogId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Hour log updated successfully!",
      data: result,
    });
  }
);

/**
 * Delete an hour log
 * DELETE /api/new-live-projects/:projectId/hours/:hourLogId
 */
const deleteHourLog = catchAsync(
  async (req: Request, res: Response) => {
    const { hourLogId } = req.params;

    const result = await NewLiveProjectService.deleteHourLogFromDB(hourLogId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Hour log deleted successfully!",
      data: result,
    });
  }
);

/**
 * Update a project action
 * PUT /api/new-live-projects/:projectId/actions/:actionId
 */
const updateProjectAction = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { actionId } = req.params;

    const result = await NewLiveProjectService.updateProjectActionIntoDB(
      actionId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Project action updated successfully!",
      data: result,
    });
  }
);

/**
 * Delete a project action
 * DELETE /api/new-live-projects/:projectId/actions/:actionId
 */
const deleteProjectAction = catchAsync(
  async (req: Request, res: Response) => {
    const { actionId } = req.params;

    const result = await NewLiveProjectService.deleteProjectActionFromDB(actionId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Project action deleted successfully!",
      data: result,
    });
  }
);

export const NewLiveProjectController = {
  createNewLiveProject,
  getAllNewLiveProjects,
  getSingleNewLiveProject,
  updateNewLiveProject,
  deleteNewLiveProject,
  uploadDocument,
  createProjectAction,
  getProjectActions,
  updateProjectAction,
  deleteProjectAction,
  createHourLog,
  getHourLogs,
  updateHourLog,
  deleteHourLog,
};
