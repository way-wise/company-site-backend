import { Prisma, Notification } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./notification.constants";
import {
  INotificationFilterParams,
  ICreateNotificationPayload,
} from "./notification.interface";

const createNotificationIntoDB = async (
  data: ICreateNotificationPayload
): Promise<Notification> => {
  return await prisma.notification.create({
    data: {
      userProfileId: data.userProfileId,
      type: data.type as any,
      title: data.title,
      message: data.message,
      data: data.data ? (data.data as any) : Prisma.JsonNull,
    },
  });
};

const getAllNotificationsFromDB = async (
  userProfileId: string,
  queryParams: INotificationFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, read, type, startDate, endDate, ...otherQueryParams } =
    queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.NotificationWhereInput[] = [
    { userProfileId }, // Always filter by user
  ];

  // Searching
  if (q) {
    const searchConditions = searchableFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
    conditions.push({ OR: searchConditions });
  }

  // Filter by read status
  if (read !== undefined) {
    const readValue = typeof read === "string" ? read === "true" : read;
    conditions.push({ read: readValue === true });
  }

  // Filter by type
  if (type) {
    conditions.push({ type: type as any });
  }

  // Filter by date range
  if (startDate || endDate) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }
    conditions.push({ createdAt: dateFilter });
  }

  // Other filters
  if (Object.keys(otherQueryParams).length > 0) {
    const filterData = Object.keys(otherQueryParams).map((key) => ({
      [key]: (otherQueryParams as any)[key],
    }));
    conditions.push(...filterData);
  }

  const result = await prisma.notification.findMany({
    where: { AND: conditions },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.notification.count({
    where: { AND: conditions },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    result,
  };
};

const getSingleNotificationFromDB = async (
  id: string,
  userProfileId: string
) => {
  return await prisma.notification.findFirstOrThrow({
    where: {
      id,
      userProfileId, // Ensure user can only access their own notifications
    },
  });
};

const getUnreadCountFromDB = async (userProfileId: string): Promise<number> => {
  return await prisma.notification.count({
    where: {
      userProfileId,
      read: false,
    },
  });
};

const markNotificationAsRead = async (
  id: string,
  userProfileId: string
): Promise<Notification> => {
  await prisma.notification.findFirstOrThrow({
    where: {
      id,
      userProfileId, // Ensure user can only mark their own notifications as read
    },
  });

  return await prisma.notification.update({
    where: { id },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
};

const markAllNotificationsAsRead = async (
  userProfileId: string
): Promise<{ count: number }> => {
  return await prisma.notification.updateMany({
    where: {
      userProfileId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
};

const deleteNotificationFromDB = async (
  id: string,
  userProfileId: string
): Promise<Notification> => {
  await prisma.notification.findFirstOrThrow({
    where: {
      id,
      userProfileId, // Ensure user can only delete their own notifications
    },
  });

  return await prisma.notification.delete({
    where: { id },
  });
};

export const NotificationService = {
  createNotificationIntoDB,
  getAllNotificationsFromDB,
  getSingleNotificationFromDB,
  getUnreadCountFromDB,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationFromDB,
};

