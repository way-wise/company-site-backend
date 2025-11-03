import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import { HTTPError } from "../../errors/HTTPError";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import {
  ICreateLeaveBalance,
  IEmployeeLeaveSummary,
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

  // Get leave balances for all employees for the given year
  const balances = await prisma.leaveBalance.findMany({
    where: {
      year: yearFilter,
      userProfileId: userProfileId
        ? userProfileId
        : { in: employees.map((emp) => emp.id) },
    },
    include: {
      leaveType: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  // Aggregate balances by employee
  const summaryMap = new Map<
    string,
    {
      employeeName: string;
      employeeEmail: string;
      totalUsedDays: number;
      totalRemainingDays: number;
      totalDays: number;
      leaveBreakdown: Array<{
        leaveTypeId: string;
        leaveTypeName: string;
        leaveTypeColor: string | null;
        usedDays: number;
        remainingDays: number;
        totalDays: number;
      }>;
    }
  >();

  // Initialize map with all employees
  employees.forEach((emp) => {
    summaryMap.set(emp.id, {
      employeeName: emp.user.name,
      employeeEmail: emp.user.email,
      totalUsedDays: 0,
      totalRemainingDays: 0,
      totalDays: 0,
      leaveBreakdown: [],
    });
  });

  // Get approved leave applications for the year to calculate actual used days
  const approvedLeaves = await prisma.leaveApplication.findMany({
    where: {
      status: "APPROVED",
      userProfileId: userProfileId
        ? userProfileId
        : { in: employees.map((emp) => emp.id) },
      startDate: {
        gte: new Date(`${yearFilter}-01-01`),
        lt: new Date(`${yearFilter + 1}-01-01`),
      },
    },
    select: {
      userProfileId: true,
      leaveTypeId: true,
      totalDays: true,
      leaveType: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  // Create a map to track used days by employee and leave type from approved leaves
  const usedDaysMap = new Map<
    string,
    Map<
      string,
      {
        usedDays: number;
        leaveTypeName: string;
        leaveTypeColor: string | null;
      }
    >
  >();

  approvedLeaves.forEach((leave) => {
    if (!usedDaysMap.has(leave.userProfileId)) {
      usedDaysMap.set(leave.userProfileId, new Map());
    }
    const employeeUsedDays = usedDaysMap.get(leave.userProfileId)!;
    if (!employeeUsedDays.has(leave.leaveTypeId)) {
      employeeUsedDays.set(leave.leaveTypeId, {
        usedDays: 0,
        leaveTypeName: leave.leaveType.name,
        leaveTypeColor: leave.leaveType.color,
      });
    }
    const typeUsedDays = employeeUsedDays.get(leave.leaveTypeId)!;
    typeUsedDays.usedDays += leave.totalDays;
  });

  // Aggregate balances and calculate actual used/remaining days
  balances.forEach((balance) => {
    const summary = summaryMap.get(balance.userProfileId);
    if (summary) {
      // Use actual used days from approved leaves if available, otherwise use balance.usedDays
      const employeeUsedDays = usedDaysMap.get(balance.userProfileId);
      const typeUsedDays = employeeUsedDays?.get(balance.leaveTypeId);
      const actualUsedDays = typeUsedDays?.usedDays ?? balance.usedDays;
      // Ensure remaining days doesn't go negative (in case approved leaves exceed allocated balance)
      const actualRemainingDays = Math.max(
        0,
        balance.totalDays - actualUsedDays
      );

      summary.totalUsedDays += actualUsedDays;
      summary.totalRemainingDays += actualRemainingDays;
      summary.totalDays += balance.totalDays;
      summary.leaveBreakdown.push({
        leaveTypeId: balance.leaveTypeId,
        leaveTypeName: balance.leaveType.name,
        leaveTypeColor: balance.leaveType.color,
        usedDays: actualUsedDays,
        remainingDays: actualRemainingDays,
        totalDays: balance.totalDays,
      });
    }
  });

  // Handle employees with approved leaves but no balance records
  usedDaysMap.forEach((employeeTypes, empId) => {
    const summary = summaryMap.get(empId);
    if (summary) {
      employeeTypes.forEach((typeData, typeId) => {
        // Only add if not already in breakdown (from balances)
        const alreadyExists = summary.leaveBreakdown.some(
          (bd) => bd.leaveTypeId === typeId
        );
        if (!alreadyExists) {
          // This employee has approved leaves but no balance record
          // We'll still show the used days
          const usedDays = typeData.usedDays;
          summary.totalUsedDays += usedDays;
          summary.leaveBreakdown.push({
            leaveTypeId: typeId,
            leaveTypeName: typeData.leaveTypeName,
            leaveTypeColor: typeData.leaveTypeColor,
            usedDays: usedDays,
            remainingDays: 0,
            totalDays: 0, // No balance allocated
          });
        }
      });
    }
  });

  // Convert map to array and recalculate totalRemainingDays as totalDays - totalUsedDays for accuracy
  let result: IEmployeeLeaveSummary[] = Array.from(summaryMap.entries()).map(
    ([userProfileId, data]) => ({
      userProfileId,
      ...data,
      // Recalculate remaining days to ensure accuracy: total - used
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
  // Get the primary leave type (prefer "Annual Leave", fallback to first active)
  let primaryLeaveType = await prisma.leaveType.findFirst({
    where: {
      name: {
        contains: "Annual",
        mode: "insensitive",
      },
      isActive: true,
    },
  });

  if (!primaryLeaveType) {
    primaryLeaveType = await prisma.leaveType.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!primaryLeaveType) {
    throw new HTTPError(
      httpStatus.NOT_FOUND,
      "No active leave type found. Please create a leave type first."
    );
  }

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
        userProfileId_leaveTypeId_year: {
          userProfileId: employee.id,
          leaveTypeId: primaryLeaveType.id,
          year,
        },
      },
    });

    if (existingBalance) {
      // Update existing balance
      const currentUsedDays = existingBalance.usedDays;
      const newRemainingDays = Math.max(0, totalDays - currentUsedDays);

      await prisma.leaveBalance.update({
        where: { id: existingBalance.id },
        data: {
          totalDays,
          remainingDays: newRemainingDays,
        },
      });
      updated++;
    } else {
      // Create new balance
      await prisma.leaveBalance.create({
        data: {
          userProfileId: employee.id,
          leaveTypeId: primaryLeaveType.id,
          year,
          totalDays,
          remainingDays: totalDays,
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
