import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./notification.constants";
import { NotificationService } from "./notification.service";

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const userProfileId = (req as any).user?.userProfile?.id;

  if (!userProfileId) {
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

  const result = await NotificationService.getAllNotificationsFromDB(
    userProfileId,
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications fetched successfully!",
    data: result,
  });
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const userProfileId = (req as any).user?.userProfile?.id;

  if (!userProfileId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "User profile not found",
      data: null,
    });
  }

  const count = await NotificationService.getUnreadCountFromDB(userProfileId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unread count fetched successfully!",
    data: { count },
  });
});

const getSingleNotification = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userProfileId = (req as any).user?.userProfile?.id;

    if (!userProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User profile not found",
        data: null,
      });
    }

    const result = await NotificationService.getSingleNotificationFromDB(
      id,
      userProfileId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification fetched successfully!",
      data: result,
    });
  }
);

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userProfileId = (req as any).user?.userProfile?.id;

  if (!userProfileId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "User profile not found",
      data: null,
    });
  }

  const result = await NotificationService.markNotificationAsRead(
    id,
    userProfileId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification marked as read!",
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const userProfileId = (req as any).user?.userProfile?.id;

  if (!userProfileId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "User profile not found",
      data: null,
    });
  }

  const result = await NotificationService.markAllNotificationsAsRead(
    userProfileId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All notifications marked as read!",
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userProfileId = (req as any).user?.userProfile?.id;

  if (!userProfileId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "User profile not found",
      data: null,
    });
  }

  const result = await NotificationService.deleteNotificationFromDB(
    id,
    userProfileId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification deleted successfully!",
    data: result,
  });
});

export const NotificationController = {
  getAllNotifications,
  getUnreadCount,
  getSingleNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

