import { randomUUID } from "crypto";
import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { UploadedFile } from "../../interfaces/file";
import { uploadFileToBlob } from "../../../helpers/blobUploader";
import { validParams } from "./chat.constants";
import { IChatAttachment } from "./chat.interface";
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

const createMessage = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id: conversationId } = req.params;
    const currentUserProfileId = req.user?.userProfile?.id;

    if (!currentUserProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const fileList = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    const attachments: IChatAttachment[] = [];

    if (fileList.length > 0) {
      await ChatService.ensureConversationParticipant(
        conversationId,
        currentUserProfileId
      );

      const uploadedAttachments = await Promise.all(
        fileList.map(async (file) => {
          const uploadResult = await uploadFileToBlob(
            file as unknown as UploadedFile,
            {
              prefix: `chat/${conversationId}`,
            }
          );

          const type: IChatAttachment["type"] = file.mimetype.startsWith(
            "image/"
          )
            ? "image"
            : "document";
          const uploadedAt = new Date().toISOString();

          return {
            id: randomUUID(),
            key: uploadResult.pathname,
            url: uploadResult.url,
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            type,
            uploadedAt,
          } satisfies IChatAttachment;
        })
      );

      attachments.push(...uploadedAttachments);
    }

    const content =
      typeof req.body.content === "string" ? req.body.content : undefined;

    const message = await ChatService.createMessage(
      conversationId,
      currentUserProfileId,
      {
        content,
        attachments: attachments.length > 0 ? attachments : undefined,
      }
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Message sent successfully!",
      data: message,
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

const getConversationMedia = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id: conversationId } = req.params;
    const currentUserProfileId = req.user?.userProfile?.id;

    if (!currentUserProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const media = await ChatService.getConversationMediaFromDB(
      conversationId,
      currentUserProfileId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Conversation media fetched successfully!",
      data: media,
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
    const { id, userProfileId } = req.params;
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
      userProfileId,
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
  createMessage,
  getUserConversations,
  getSingleConversation,
  getConversationMessages,
  getConversationMedia,
  addParticipants,
  removeParticipant,
  editMessage,
  deleteMessage,
};
