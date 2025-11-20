import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { uploadFileToBlob } from "../../../helpers/blobUploader";
import { UploadedFile } from "../../interfaces/file";
import { ProjectFileService } from "./projectFile.service";

const getFilesByProjectId = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { projectId } = req.params;

    const result = await ProjectFileService.getFilesByProjectId(projectId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Files fetched successfully!",
      data: result,
    });
  }
);

const uploadFile = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const projectId = req.body?.projectId;
    const userProfileId = req.user?.userProfile?.id;

    if (!userProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    if (!projectId) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Project ID is required",
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
        prefix: `projects/${projectId}`,
      });

      // Save file record to database
      const result = await ProjectFileService.createFile({
        projectId,
        fileName: file.originalname,
        fileUrl: uploadResult.url,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: userProfileId,
      });

      sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "File uploaded successfully!",
        data: result,
      });
    } catch (error) {
      console.error("File upload error:", error);
      return sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: error instanceof Error ? error.message : "Failed to upload file",
        data: null,
      });
    }
  }
);

const deleteFile = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;

    const result = await ProjectFileService.deleteFile(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "File deleted successfully!",
      data: result,
    });
  }
);

export const ProjectFileController = {
  getFilesByProjectId,
  uploadFile,
  deleteFile,
};

