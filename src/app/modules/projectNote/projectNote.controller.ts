import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { ProjectNoteService } from "./projectNote.service";

const getNoteByProjectId = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { projectId } = req.params;

    const result = await ProjectNoteService.getNoteByProjectId(projectId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result
        ? "Note fetched successfully!"
        : "No note found for this project",
      data: result,
    });
  }
);

const createOrUpdateNote = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { projectId, content } = req.body;
    const userProfileId = req.user?.userProfile?.id;

    if (!userProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await ProjectNoteService.createOrUpdateNote({
      projectId,
      content: content || "",
      createdBy: userProfileId,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Note saved successfully!",
      data: result,
    });
  }
);

const updateNote = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;

    const result = await ProjectNoteService.updateNote(id, { content });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Note updated successfully!",
      data: result,
    });
  }
);

export const ProjectNoteController = {
  getNoteByProjectId,
  createOrUpdateNote,
  updateNote,
};

