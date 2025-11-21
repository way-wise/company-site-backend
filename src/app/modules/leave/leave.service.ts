import { LeaveStatus, LeaveType, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import { createAndEmitNotification } from "../../../helpers/notificationHelper";
import prisma from "../../../shared/prismaClient";
import { HTTPError } from "../../errors/HTTPError";
import {
  ICreateLeaveApplication,
  ILeaveApplication,
  ILeaveApplicationWithRelations,
  ILeaveCalendarEvent,
  ILeaveStats,
  IUpdateLeaveStatus,
} from "./leave.interface";
import { LEAVE_TYPE_CONFIG, LeaveTypeConfig } from "./leaveType.config";
const getLeaveTypeConfig = (type: LeaveType): LeaveTypeConfig => {
  const config = LEAVE_TYPE_CONFIG[type];

  if (!config) {
    throw new HTTPError(httpStatus.BAD_REQUEST, "Invalid leave type");
  }

  return config;
};

const mapLeaveApplication = <T extends { leaveType: LeaveType }>(
  application: T
) => ({
  ...application,
  leaveTypeMeta: getLeaveTypeConfig(application.leaveType),
});

// Helper function to calculate business days
const calculateTotalDays = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let totalDays = 0;

  while (start <= end) {
    const dayOfWeek = start.getDay();
    // Exclude weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      totalDays++;
    }
    start.setDate(start.getDate() + 1);
  }

  return totalDays || 1; // Minimum 1 day
};

const createLeaveApplication = async (
  data: ICreateLeaveApplication
): Promise<ILeaveApplication> => {
  const { employeeId: userProfileId, startDate, endDate } = data;
  const leaveTypeValue = (data.leaveType ?? LeaveType.CASUAL) as LeaveType;

  const leaveTypeConfig = getLeaveTypeConfig(leaveTypeValue);

  // Check for overlapping leave applications
  const overlappingLeave = await prisma.leaveApplication.findFirst({
    where: {
      userProfileId,
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

  // Calculate total days
  const totalDays = calculateTotalDays(new Date(startDate), new Date(endDate));

  // Check balance (only for leave types with balance tracking)
  if (leaveTypeConfig.defaultDaysPerYear > 0) {
    const year = new Date().getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        userProfileId_leaveType_year: {
          userProfileId,
          leaveType: leaveTypeValue,
          year,
        },
      },
    });

    if (!balance) {
      throw new HTTPError(
        httpStatus.BAD_REQUEST,
        "No leave balance found for this leave type"
      );
    }

    if (balance.remainingDays < totalDays) {
      throw new HTTPError(
        httpStatus.BAD_REQUEST,
        `Insufficient leave balance. You have ${balance.remainingDays} days remaining`
      );
    }
  }

  const result = await prisma.leaveApplication.create({
    data: {
      userProfileId,
      leaveType: leaveTypeValue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays,
      reason: data.reason,
      attachmentUrl: data.attachmentUrl,
    },
  });

  return result;
};

const getMyLeaveApplications = async (
  userProfileId: string,
  filters: any,
  paginationOptions: any
): Promise<{ result: ILeaveApplicationWithRelations[]; meta: any }> => {
  const { page, limit, skip, sortBy, sortOrder } =
    generatePaginateAndSortOptions(paginationOptions);

  const andConditions: Prisma.LeaveApplicationWhereInput[] = [
    { userProfileId },
  ];

  if (filters.status) {
    andConditions.push({
      status: filters.status as LeaveStatus,
    });
  }

  if (filters.leaveType) {
    andConditions.push({
      leaveType: filters.leaveType as LeaveType,
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
      userProfile: {
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
      approver: {
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
    result: result.map(mapLeaveApplication),
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

  if (filters.employeeId || filters.userProfileId) {
    andConditions.push({
      userProfileId: filters.employeeId || filters.userProfileId,
    });
  }

  if (filters.leaveType) {
    andConditions.push({
      leaveType: filters.leaveType as LeaveType,
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
      userProfile: {
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
      approver: {
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
    result: result.map(mapLeaveApplication),
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
      userProfile: {
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
      approver: {
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

  return result ? mapLeaveApplication(result) : null;
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
      rejectionReason: data.rejectionReason,
      comments: data.comments,
    },
    include: {
      userProfile: {
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
      approver: {
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

  // Update balance if approved
  if (data.status === "APPROVED") {
    const year = new Date().getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        userProfileId_leaveType_year: {
          userProfileId: existingLeave.userProfileId,
          leaveType: existingLeave.leaveType,
          year,
        },
      },
    });

    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          usedDays: { increment: existingLeave.totalDays },
          remainingDays: {
            decrement: existingLeave.totalDays,
          },
        },
      });
    }

    // Send approval notification
    await createAndEmitNotification({
      userProfileId: existingLeave.userProfileId,
      type: "LEAVE",
      title: "Leave Application Approved",
      message: `Your ${existingLeave.leaveType} leave application from ${new Date(existingLeave.startDate).toLocaleDateString()} to ${new Date(existingLeave.endDate).toLocaleDateString()} has been approved`,
      data: {
        leaveApplicationId: existingLeave.id,
        leaveType: existingLeave.leaveType,
        startDate: existingLeave.startDate,
        endDate: existingLeave.endDate,
        totalDays: existingLeave.totalDays,
      },
    });
  } else if (data.status === "REJECTED") {
    // Send rejection notification
    await createAndEmitNotification({
      userProfileId: existingLeave.userProfileId,
      type: "LEAVE",
      title: "Leave Application Rejected",
      message: `Your ${existingLeave.leaveType} leave application has been rejected${data.rejectionReason ? `: ${data.rejectionReason}` : ""}`,
      data: {
        leaveApplicationId: existingLeave.id,
        leaveType: existingLeave.leaveType,
        rejectionReason: data.rejectionReason,
      },
    });
  }

  return mapLeaveApplication(result);
};

const deleteLeaveApplication = async (
  id: string,
  userProfileId: string
): Promise<ILeaveApplication> => {
  const existingLeave = await prisma.leaveApplication.findUnique({
    where: { id },
  });

  if (!existingLeave) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Leave application not found");
  }

  if (existingLeave.userProfileId !== userProfileId) {
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

const cancelLeaveApplication = async (
  id: string,
  userId: string
): Promise<ILeaveApplicationWithRelations> => {
  const existingLeave = await prisma.leaveApplication.findUnique({
    where: { id },
    include: {
      userProfile: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!existingLeave) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Leave application not found");
  }

  if (existingLeave.status !== "APPROVED") {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "Only approved leave applications can be cancelled"
    );
  }

  // Route already requires update_leave permission, so if user reaches here they have it
  // Admins with update_leave permission can cancel any approved leave
  // Note: Since route requires update_leave permission, only admins can access this endpoint

  const userProfileId = existingLeave.userProfileId;

  const result = await prisma.leaveApplication.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
    include: {
      userProfile: {
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
      approver: {
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

  // Restore balance
  const leaveTypeMeta = getLeaveTypeConfig(existingLeave.leaveType);

  if (leaveTypeMeta.defaultDaysPerYear > 0) {
    const year = new Date().getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        userProfileId_leaveType_year: {
          userProfileId: existingLeave.userProfileId,
          leaveType: existingLeave.leaveType,
          year,
        },
      },
    });

    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          usedDays: { decrement: existingLeave.totalDays },
          remainingDays: { increment: existingLeave.totalDays },
        },
      });
    }
  }

  return mapLeaveApplication(result);
};

const getLeaveStats = async (filters?: any): Promise<ILeaveStats> => {
  const year = filters?.year || new Date().getFullYear();

  const whereConditions: Prisma.LeaveApplicationWhereInput = {
    ...(filters?.userProfileId && { userProfileId: filters.userProfileId }),
    ...(filters?.year && {
      OR: [
        { startDate: { gte: new Date(year, 0, 1) } },
        { endDate: { lte: new Date(year, 11, 31) } },
      ],
    }),
  };

  const [total, pending, approved, rejected, cancelled, allApplications] =
    await Promise.all([
      prisma.leaveApplication.count({ where: whereConditions }),
      prisma.leaveApplication.count({
        where: { ...whereConditions, status: "PENDING" },
      }),
      prisma.leaveApplication.count({
        where: { ...whereConditions, status: "APPROVED" },
      }),
      prisma.leaveApplication.count({
        where: { ...whereConditions, status: "REJECTED" },
      }),
      prisma.leaveApplication.count({
        where: { ...whereConditions, status: "CANCELLED" },
      }),
      prisma.leaveApplication.findMany({
        where: whereConditions,
        select: {
          leaveType: true,
        },
      }),
    ]);

  // Count by type
  const typeCountMap = new Map<LeaveType, { count: number; color: string }>();

  allApplications.forEach((app) => {
    const meta = getLeaveTypeConfig(app.leaveType);
    const existing = typeCountMap.get(app.leaveType) || {
      count: 0,
      color: meta.color,
    };
    typeCountMap.set(app.leaveType, {
      count: existing.count + 1,
      color: meta.color,
    });
  });

  const byType = Array.from(typeCountMap.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    color: data.color,
  }));

  return {
    total,
    pending,
    approved,
    rejected,
    cancelled,
    byType,
  };
};

const getLeaveCalendar = async (
  filters?: any
): Promise<ILeaveCalendarEvent[]> => {
  const whereConditions: Prisma.LeaveApplicationWhereInput = {
    status: {
      in: ["PENDING", "APPROVED"],
    },
    ...(filters?.userProfileId && { userProfileId: filters.userProfileId }),
    ...(filters?.leaveType && { leaveType: filters.leaveType as LeaveType }),
    ...(filters?.startDate && {
      startDate: {
        gte: new Date(filters.startDate),
      },
    }),
    ...(filters?.endDate && {
      endDate: {
        lte: new Date(filters.endDate),
      },
    }),
  };

  const leaves = await prisma.leaveApplication.findMany({
    where: whereConditions,
    include: {
      userProfile: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });

  return leaves.map((leave) => {
    const meta = getLeaveTypeConfig(leave.leaveType);

    return {
      id: leave.id,
      title: `${leave.userProfile.user.name} - ${meta.label}`,
      start: leave.startDate,
      end: leave.endDate,
      user: {
        name: leave.userProfile.user.name,
        email: leave.userProfile.user.email,
      },
      type: {
        value: leave.leaveType,
        label: meta.label,
        color: meta.color,
      },
      status: leave.status,
    };
  });
};

export const LeaveService = {
  createLeaveApplication,
  getMyLeaveApplications,
  getAllLeaveApplications,
  getSingleLeaveApplication,
  updateLeaveStatus,
  deleteLeaveApplication,
  cancelLeaveApplication,
  getLeaveStats,
  getLeaveCalendar,
};
