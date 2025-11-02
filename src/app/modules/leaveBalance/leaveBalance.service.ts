import { Prisma } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { HTTPError } from "../../errors/HTTPError";
import httpStatus from "http-status";
import {
  ICreateLeaveBalance,
  ILeaveBalance,
  ILeaveBalanceFilterParams,
  ILeaveBalanceWithRelations,
  IUpdateLeaveBalance,
} from "./leaveBalance.interface";

const createLeaveBalance = async (
  data: ICreateLeaveBalance
): Promise<ILeaveBalance> => {
  const existingBalance = await prisma.leaveBalance.findUnique({
    where: {
      userProfileId_leaveTypeId_year: {
        userProfileId: data.userProfileId,
        leaveTypeId: data.leaveTypeId,
        year: data.year,
      },
    },
  });

  if (existingBalance) {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "Leave balance already exists for this user, type, and year"
    );
  }

  return await prisma.leaveBalance.create({
    data: {
      userProfileId: data.userProfileId,
      leaveTypeId: data.leaveTypeId,
      year: data.year,
      totalDays: data.totalDays,
      remainingDays: data.totalDays,
      usedDays: 0,
    },
  });
};

const getAllLeaveBalances = async (
  queryParams: ILeaveBalanceFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
): Promise<{
  result: ILeaveBalanceWithRelations[];
  meta: any;
}> => {
  const { page, limit, skip, sortBy, sortOrder } =
    generatePaginateAndSortOptions(paginationAndSortingQueryParams);

  const conditions: Prisma.LeaveBalanceWhereInput[] = [];

  if (queryParams.userProfileId) {
    conditions.push({ userProfileId: queryParams.userProfileId });
  }

  if (queryParams.leaveTypeId) {
    conditions.push({ leaveTypeId: queryParams.leaveTypeId });
  }

  if (queryParams.year) {
    conditions.push({ year: queryParams.year });
  }

  const whereConditions: Prisma.LeaveBalanceWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  const result = await prisma.leaveBalance.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder ? { [sortBy]: sortOrder } : { year: "desc", createdAt: "desc" },
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
      leaveType: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
        },
      },
    },
  });

  const total = await prisma.leaveBalance.count({
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

const getUserLeaveBalances = async (
  userProfileId: string,
  year?: number
): Promise<ILeaveBalanceWithRelations[]> => {
  const yearFilter = year || new Date().getFullYear();

  const balances = await prisma.leaveBalance.findMany({
    where: {
      userProfileId,
      year: yearFilter,
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
      leaveType: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
        },
      },
    },
    orderBy: {
      leaveType: {
        name: "asc",
      },
    },
  });

  return balances;
};

const getSingleLeaveBalance = async (
  id: string
): Promise<ILeaveBalanceWithRelations | null> => {
  return await prisma.leaveBalance.findUnique({
    where: { id },
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
      leaveType: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
        },
      },
    },
  });
};

const updateLeaveBalance = async (
  id: string,
  data: IUpdateLeaveBalance
): Promise<ILeaveBalance> => {
  const existingBalance = await prisma.leaveBalance.findUnique({
    where: { id },
  });

  if (!existingBalance) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Leave balance not found");
  }

  let updateData: any = {};

  // Update total days and recalculate remaining
  if (data.totalDays !== undefined) {
    updateData.totalDays = data.totalDays;
    updateData.remainingDays = data.totalDays - existingBalance.usedDays;
  }

  // Update used days and recalculate remaining
  if (data.usedDays !== undefined) {
    updateData.usedDays = data.usedDays;
    updateData.remainingDays = existingBalance.totalDays - data.usedDays;
  }

  return await prisma.leaveBalance.update({
    where: { id },
    data: updateData,
  });
};

const deleteLeaveBalance = async (id: string): Promise<ILeaveBalance> => {
  const existingBalance = await prisma.leaveBalance.findUnique({
    where: { id },
  });

  if (!existingBalance) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Leave balance not found");
  }

  return await prisma.leaveBalance.delete({
    where: { id },
  });
};

const allocateAnnualBalance = async (
  userProfileId: string,
  year: number
): Promise<ILeaveBalance[]> => {
  const activeLeaveTypes = await prisma.leaveType.findMany({
    where: { isActive: true },
  });

  const balancesToCreate: ICreateLeaveBalance[] = [];

  for (const leaveType of activeLeaveTypes) {
    if (leaveType.defaultDaysPerYear > 0) {
      const existingBalance = await prisma.leaveBalance.findUnique({
        where: {
          userProfileId_leaveTypeId_year: {
            userProfileId,
            leaveTypeId: leaveType.id,
            year,
          },
        },
      });

      if (!existingBalance) {
        balancesToCreate.push({
          userProfileId,
          leaveTypeId: leaveType.id,
          year,
          totalDays: leaveType.defaultDaysPerYear,
        });
      }
    }
  }

  const results: ILeaveBalance[] = [];
  for (const balance of balancesToCreate) {
    const created = await createLeaveBalance(balance);
    results.push(created);
  }

  return results;
};

export const LeaveBalanceService = {
  createLeaveBalance,
  getAllLeaveBalances,
  getUserLeaveBalances,
  getSingleLeaveBalance,
  updateLeaveBalance,
  deleteLeaveBalance,
  allocateAnnualBalance,
};

