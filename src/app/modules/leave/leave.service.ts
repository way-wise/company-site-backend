import { LeaveStatus, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import { HTTPError } from "../../errors/HTTPError";
import {
  ICreateLeaveApplication,
  ILeaveApplication,
  ILeaveApplicationWithRelations,
  IUpdateLeaveStatus,
} from "./leave.interface";

const createLeaveApplication = async (
  data: ICreateLeaveApplication
): Promise<ILeaveApplication> => {
  const { employeeId, startDate, endDate } = data;

  // Check for overlapping leave applications
  const overlappingLeave = await prisma.leaveApplication.findFirst({
    where: {
      employeeId,
      status: {
        in: ["PENDING", "APPROVED"],
      },
      OR: [
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(startDate) } },
          ],
        },
        {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(endDate) } },
          ],
        },
        {
          AND: [
            { startDate: { gte: new Date(startDate) } },
            { endDate: { lte: new Date(endDate) } },
          ],
        },
      ],
    },
  });

  if (overlappingLeave) {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "You already have a leave application for this period"
    );
  }

  const result = await prisma.leaveApplication.create({
    data: {
      employeeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: data.reason,
    },
  });

  return result;
};

const getMyLeaveApplications = async (
  employeeId: string,
  filters: any,
  paginationOptions: any
): Promise<{ result: ILeaveApplicationWithRelations[]; meta: any }> => {
  const { page, limit, skip, sortBy, sortOrder } =
    generatePaginateAndSortOptions(paginationOptions);

  const andConditions: Prisma.LeaveApplicationWhereInput[] = [{ employeeId }];

  if (filters.status) {
    andConditions.push({
      status: filters.status as LeaveStatus,
    });
  }

  if (filters.startDate) {
    andConditions.push({
      startDate: {
        gte: new Date(filters.startDate),
      },
    });
  }

  if (filters.endDate) {
    andConditions.push({
      endDate: {
        lte: new Date(filters.endDate),
      },
    });
  }

  const whereConditions: Prisma.LeaveApplicationWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.leaveApplication.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    include: {
      employee: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      admin: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.leaveApplication.count({
    where: whereConditions,
  });

  return {
    result,
    meta: {
      page,
      limit,
      total,
    },
  };
};

const getAllLeaveApplications = async (
  filters: any,
  paginationOptions: any
): Promise<{ result: ILeaveApplicationWithRelations[]; meta: any }> => {
  const { page, limit, skip, sortBy, sortOrder } =
    generatePaginateAndSortOptions(paginationOptions);

  const andConditions: Prisma.LeaveApplicationWhereInput[] = [];

  if (filters.status) {
    andConditions.push({
      status: filters.status as LeaveStatus,
    });
  }

  if (filters.employeeId) {
    andConditions.push({
      employeeId: filters.employeeId,
    });
  }

  if (filters.approvedBy) {
    andConditions.push({
      approvedBy: filters.approvedBy,
    });
  }

  if (filters.startDate) {
    andConditions.push({
      startDate: {
        gte: new Date(filters.startDate),
      },
    });
  }

  if (filters.endDate) {
    andConditions.push({
      endDate: {
        lte: new Date(filters.endDate),
      },
    });
  }

  const whereConditions: Prisma.LeaveApplicationWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.leaveApplication.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    include: {
      employee: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      admin: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.leaveApplication.count({
    where: whereConditions,
  });

  return {
    result,
    meta: {
      page,
      limit,
      total,
    },
  };
};

const getSingleLeaveApplication = async (
  id: string
): Promise<ILeaveApplicationWithRelations | null> => {
  const result = await prisma.leaveApplication.findUnique({
    where: {
      id,
    },
    include: {
      employee: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      admin: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const updateLeaveStatus = async (
  id: string,
  data: IUpdateLeaveStatus
): Promise<ILeaveApplicationWithRelations> => {
  const existingLeave = await prisma.leaveApplication.findUnique({
    where: { id },
  });

  if (!existingLeave) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Leave application not found");
  }

  if (existingLeave.status !== "PENDING") {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "Only pending leave applications can be updated"
    );
  }

  const result = await prisma.leaveApplication.update({
    where: { id },
    data: {
      status: data.status,
      approvedBy: data.approvedBy,
    },
    include: {
      employee: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      admin: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const deleteLeaveApplication = async (
  id: string,
  employeeId: string
): Promise<ILeaveApplication> => {
  const existingLeave = await prisma.leaveApplication.findUnique({
    where: { id },
  });

  if (!existingLeave) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Leave application not found");
  }

  if (existingLeave.employeeId !== employeeId) {
    throw new HTTPError(
      httpStatus.FORBIDDEN,
      "You can only delete your own leave applications"
    );
  }

  if (existingLeave.status !== "PENDING") {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "Only pending leave applications can be deleted"
    );
  }

  const result = await prisma.leaveApplication.delete({
    where: { id },
  });

  return result;
};

export const LeaveService = {
  createLeaveApplication,
  getMyLeaveApplications,
  getAllLeaveApplications,
  getSingleLeaveApplication,
  updateLeaveStatus,
  deleteLeaveApplication,
};
