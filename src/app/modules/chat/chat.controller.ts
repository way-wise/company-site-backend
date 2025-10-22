import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./chat.constants";
import { ChatService } from "./chat.service";

const createConversation = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const currentUserProfileId = req.user?.userProfile?.id;

    if (!currentUserProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await ChatService.createConversationIntoDB(
      currentUserProfileId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Conversation created successfully!",
      data: result,
    });
  }
);

const getUserConversations = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const currentUserProfileId = req.user?.userProfile?.id;

    if (!currentUserProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
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

    const result = await ChatService.getUserConversationsFromDB(
      currentUserProfileId,
      validQueryParams,
      paginationAndSortingQueryParams
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Conversations fetched successfully!",
      data: result,
    });
  }
);

const getSingleConversation = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const currentUserProfileId = req.user?.userProfile?.id;

    if (!currentUserProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await ChatService.getSingleConversationFromDB(
      id,
      currentUserProfileId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Conversation fetched successfully!",
      data: result,
    });
  }
);

const getConversationMessages = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const currentUserProfileId = req.user?.userProfile?.id;

    if (!currentUserProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const paginationAndSortingQueryParams = filterValidQueryParams(
      req.query,
      paginationAndSortingParams
    );

    const result = await ChatService.getConversationMessagesFromDB(
      id,
      currentUserProfileId,
      paginationAndSortingQueryParams
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Messages fetched successfully!",
      data: result,
    });
  }
);

const addParticipants = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const currentUserProfileId = req.user?.userProfile?.id;

    if (!currentUserProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await ChatService.addParticipantsToConversation(
      id,
      currentUserProfileId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Participants added successfully!",
      data: result,
    });
  }
);

const removeParticipant = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id, userId } = req.params;
    const currentUserProfileId = req.user?.userProfile?.id;

    if (!currentUserProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await ChatService.removeParticipantFromConversation(
      id,
      userId,
      currentUserProfileId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Participant removed successfully!",
      data: result,
    });
  }
);

const editMessage = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;
    const currentUserProfileId = req.user?.userProfile?.id;

    if (!currentUserProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await ChatService.editMessageInDB(
      id,
      currentUserProfileId,
      content
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Message edited successfully!",
      data: result,
    });
  }
);

const deleteMessage = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;
    const currentUserProfileId = req.user?.userProfile?.id;

    if (!currentUserProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await ChatService.deleteMessageFromDB(
      id,
      currentUserProfileId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Message deleted successfully!",
      data: result,
    });
  }
);

export const ChatController = {
  createConversation,
  getUserConversations,
  getSingleConversation,
  getConversationMessages,
  addParticipants,
  removeParticipant,
  editMessage,
  deleteMessage,
};
