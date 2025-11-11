import { LeaveType, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import { HTTPError } from "../../errors/HTTPError";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { LEAVE_TYPE_CONFIG, leaveTypeValues } from "../leave/leaveType.config";
import {
  ICreateLeaveBalance,
  IEmployeeLeaveSummary,
  ILeaveBalance,
  ILeaveBalanceFilterParams,
  ILeaveBalanceWithRelations,
  IUpdateLeaveBalance,
} from "./leaveBalance.interface";

const mapBalance = <T extends { leaveType: LeaveType }>(
  balance: T
): T & {
  leaveTypeMeta: (typeof LEAVE_TYPE_CONFIG)[LeaveType];
} => ({
  ...balance,
  leaveTypeMeta: LEAVE_TYPE_CONFIG[balance.leaveType],
});

const ensureValidLeaveType = (leaveType: LeaveType): LeaveType => {
  if (!leaveTypeValues.includes(leaveType)) {
    throw new HTTPError(httpStatus.BAD_REQUEST, "Invalid leave type");
  }
  return leaveType;
};

const createLeaveBalance = async (
  data: ICreateLeaveBalance
): Promise<ILeaveBalance> => {
  const leaveType = ensureValidLeaveType(data.leaveType);

  const existingBalance = await prisma.leaveBalance.findUnique({
    where: {
      userProfileId_leaveType_year: {
        userProfileId: data.userProfileId,
        leaveType,
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
      leaveType,
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

  if (queryParams.leaveType) {
    conditions.push({ leaveType: queryParams.leaveType });
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
      sortBy && sortOrder
        ? { [sortBy]: sortOrder }
        : { year: "desc", createdAt: "desc" },
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
    },
  });

  const total = await prisma.leaveBalance.count({
    where: whereConditions,
  });

  return {
    result: result.map(mapBalance),
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
    },
    orderBy: {
      leaveType: "asc",
    },
  });

  return balances.map(mapBalance);
};

const getSingleLeaveBalance = async (
  id: string
): Promise<ILeaveBalanceWithRelations | null> => {
  return await prisma.leaveBalance
    .findUnique({
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
      },
    })
    .then((balance) => (balance ? mapBalance(balance) : null));
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
  const balancesToCreate: ICreateLeaveBalance[] = [];

  for (const leaveType of leaveTypeValues) {
    const config = LEAVE_TYPE_CONFIG[leaveType];

    if (config.defaultDaysPerYear <= 0) continue;

    const existingBalance = await prisma.leaveBalance.findUnique({
      where: {
        userProfileId_leaveType_year: {
          userProfileId,
          leaveType,
          year,
        },
      },
    });

    if (!existingBalance) {
      balancesToCreate.push({
        userProfileId,
        leaveType,
        year,
        totalDays: config.defaultDaysPerYear,
      });
    }
  }

  const results: ILeaveBalance[] = [];
  for (const balance of balancesToCreate) {
    const created = await createLeaveBalance(balance);
    results.push(created);
  }

  return results;
};

const getEmployeesLeaveSummary = async (
  year: number,
  userProfileId?: string,
  paginationAndSortingQueryParams?: IPaginationParams & ISortingParams
): Promise<{
  result: IEmployeeLeaveSummary[];
  meta: any;
}> => {
  const yearFilter = year || new Date().getFullYear();

  // Build conditions for filtering employees
  const conditions: Prisma.UserProfileWhereInput[] = [
    { isDeleted: false },
    {
      user: {
        roles: {
          some: {
            role: {
              name: "EMPLOYEE",
            },
          },
        },
      },
    },
  ];

  // If userProfileId is provided, only return that employee's data
  if (userProfileId) {
    conditions.push({ id: userProfileId });
  }

  // Get all employees (or specific employee if userProfileId provided)
  const employees = await prisma.userProfile.findMany({
    where: { AND: conditions },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  const employeeIdList = userProfileId
    ? [userProfileId]
    : employees.map((emp) => emp.id);

  const balances = await prisma.leaveBalance.findMany({
    where: {
      year: yearFilter,
      userProfileId: { in: employeeIdList },
    },
  });

  const summaryMap = new Map<string, IEmployeeLeaveSummary>();

  employees.forEach((emp) => {
    summaryMap.set(emp.id, {
      userProfileId: emp.id,
      employeeName: emp.user.name,
      employeeEmail: emp.user.email,
      totalUsedDays: 0,
      totalRemainingDays: 0,
      totalDays: 0,
      leaveBreakdown: [],
    });
  });

  const approvedLeaves = await prisma.leaveApplication.findMany({
    where: {
      status: "APPROVED",
      userProfileId: { in: employeeIdList },
      startDate: {
        gte: new Date(`${yearFilter}-01-01`),
        lt: new Date(`${yearFilter + 1}-01-01`),
      },
    },
    select: {
      userProfileId: true,
      leaveType: true,
      totalDays: true,
    },
  });

  const usedDaysMap = new Map<string, Map<LeaveType, number>>();
  approvedLeaves.forEach((leave) => {
    if (!usedDaysMap.has(leave.userProfileId)) {
      usedDaysMap.set(leave.userProfileId, new Map());
    }
    const employeeUsedDays = usedDaysMap.get(leave.userProfileId)!;
    employeeUsedDays.set(
      leave.leaveType,
      (employeeUsedDays.get(leave.leaveType) ?? 0) + leave.totalDays
    );
  });

  balances.forEach((balance) => {
    const summary = summaryMap.get(balance.userProfileId);
    if (!summary) return;

    const meta = LEAVE_TYPE_CONFIG[balance.leaveType];
    const actualUsedDays =
      usedDaysMap.get(balance.userProfileId)?.get(balance.leaveType) ??
      balance.usedDays;
    const actualRemainingDays = Math.max(0, balance.totalDays - actualUsedDays);

    summary.totalUsedDays += actualUsedDays;
    summary.totalRemainingDays += actualRemainingDays;
    summary.totalDays += balance.totalDays;
    summary.leaveBreakdown.push({
      leaveType: balance.leaveType,
      leaveTypeMeta: meta,
      usedDays: actualUsedDays,
      remainingDays: actualRemainingDays,
      totalDays: balance.totalDays,
    });
  });

  usedDaysMap.forEach((types, employee) => {
    const summary = summaryMap.get(employee);
    if (!summary) return;

    types.forEach((usedDays, leaveType) => {
      const alreadyExists = summary.leaveBreakdown.some(
        (bd) => bd.leaveType === leaveType
      );
      if (alreadyExists) return;

      summary.totalUsedDays += usedDays;
      summary.leaveBreakdown.push({
        leaveType,
        leaveTypeMeta: LEAVE_TYPE_CONFIG[leaveType],
        usedDays,
        remainingDays: 0,
        totalDays: 0,
      });
    });
  });

  let result: IEmployeeLeaveSummary[] = Array.from(summaryMap.values()).map(
    (data) => ({
      ...data,
      totalRemainingDays: Math.max(0, data.totalDays - data.totalUsedDays),
    })
  );

  // Apply pagination if provided
  let meta = { page: 1, limit: result.length, total: result.length };

  if (paginationAndSortingQueryParams) {
    const { page, limit, skip, sortBy, sortOrder } =
      generatePaginateAndSortOptions(paginationAndSortingQueryParams);

    // Sort results
    if (sortBy && sortOrder) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortBy];
        const bValue = (b as any)[sortBy];
        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    } else {
      // Default sort by employee name
      result.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    }

    const total = result.length;
    result = result.slice(skip, skip + limit);

    meta = { page, limit, total };
  } else {
    // Default sort by employee name
    result.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }

  return { result, meta };
};

const allocateYearlyLeaveForAllEmployees = async (
  year: number,
  totalDays: number
): Promise<{
  allocated: number;
  updated: number;
  totalEmployees: number;
}> => {
  const preferredType = leaveTypeValues.find(
    (type) => type === LeaveType.CASUAL
  );
  const primaryLeaveType = preferredType ?? leaveTypeValues[0];

  if (!primaryLeaveType) {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "No leave types are configured. Please define leave types in configuration."
    );
  }

  const allocationDays =
    totalDays ?? LEAVE_TYPE_CONFIG[primaryLeaveType].defaultDaysPerYear;

  // Get all employees with EMPLOYEE role
  const employees = await prisma.userProfile.findMany({
    where: {
      isDeleted: false,
      user: {
        roles: {
          some: {
            role: {
              name: "EMPLOYEE",
            },
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (employees.length === 0) {
    throw new HTTPError(
      httpStatus.NOT_FOUND,
      "No employees found in the system"
    );
  }

  let allocated = 0;
  let updated = 0;

  // Process each employee
  for (const employee of employees) {
    const existingBalance = await prisma.leaveBalance.findUnique({
      where: {
        userProfileId_leaveType_year: {
          userProfileId: employee.id,
          leaveType: primaryLeaveType,
          year,
        },
      },
    });

    if (existingBalance) {
      // Update existing balance
      const currentUsedDays = existingBalance.usedDays;
      const newRemainingDays = Math.max(0, allocationDays - currentUsedDays);

      await prisma.leaveBalance.update({
        where: { id: existingBalance.id },
        data: {
          totalDays: allocationDays,
          remainingDays: newRemainingDays,
        },
      });
      updated++;
    } else {
      // Create new balance
      await prisma.leaveBalance.create({
        data: {
          userProfileId: employee.id,
          leaveType: primaryLeaveType,
          year,
          totalDays: allocationDays,
          remainingDays: allocationDays,
          usedDays: 0,
        },
      });
      allocated++;
    }
  }

  return {
    allocated,
    updated,
    totalEmployees: employees.length,
  };
};

export const LeaveBalanceService = {
  createLeaveBalance,
  getAllLeaveBalances,
  getUserLeaveBalances,
  getSingleLeaveBalance,
  updateLeaveBalance,
  deleteLeaveBalance,
  allocateAnnualBalance,
  getEmployeesLeaveSummary,
  allocateYearlyLeaveForAllEmployees,
};
