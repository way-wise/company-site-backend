import { Prisma } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./earning.constants";
import { IEarningFilterParams } from "./earning.interface";

const createEarningIntoDB = async (data: {
  amount: number;
  description?: string;
  date: Date | string;
  projectId?: string;
  category?: string;
  createdBy: string;
}) => {
  // Validate that userProfileId exists
  const userProfile = await prisma.userProfile.findUnique({
    where: { id: data.createdBy },
  });

  if (!userProfile) {
    throw new Error(`UserProfile with id ${data.createdBy} not found`);
  }

  // Validate projectId if provided
  if (data.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error(`Project with id ${data.projectId} not found`);
    }
  }

  const dateValue = typeof data.date === "string" ? new Date(data.date) : data.date;

  return await (prisma as any).earning.create({
    data: {
      amount: data.amount,
      description: data.description,
      date: dateValue,
      projectId: data.projectId,
      category: data.category,
      createdBy: data.createdBy,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      creator: {
        select: {
          id: true,
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
};

const getAllEarningsFromDB = async (
  queryParams: IEarningFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, startDate, endDate, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: any[] = [];

  // Searching
  if (q) {
    const searchConditions = searchableFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
    conditions.push({ OR: searchConditions });
  }

  // Date range filtering
  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.date = {
        ...dateFilter.date,
        lte: new Date(endDate),
      };
    }
    conditions.push(dateFilter);
  }

  // Filtering with exact value
  if (Object.keys(otherQueryParams).length > 0) {
    const filterData = Object.keys(otherQueryParams).map((key) => ({
      [key]: (otherQueryParams as any)[key],
    }));
    conditions.push(...filterData);
  }

  const result = await (prisma as any).earning.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      creator: {
        select: {
          id: true,
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

  const total = await (prisma as any).earning.count({
    where: conditions.length > 0 ? { AND: conditions } : {},
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    result,
  };
};

const getSingleEarningFromDB = async (id: string) => {
  return await (prisma as any).earning.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      creator: {
        select: {
          id: true,
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
};

const updateEarningIntoDB = async (
  id: string,
  data: {
    amount?: number;
    description?: string;
    date?: Date | string;
    projectId?: string | null;
    category?: string;
  }
) => {
  await (prisma as any).earning.findUniqueOrThrow({
    where: {
      id,
    },
  });

  // Validate projectId if provided
  if (data.projectId !== undefined && data.projectId !== null) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error(`Project with id ${data.projectId} not found`);
    }
  }

  const updateData: any = { ...data };
  if (data.date) {
    updateData.date = typeof data.date === "string" ? new Date(data.date) : data.date;
  }

  return await (prisma as any).earning.update({
    where: {
      id,
    },
    data: updateData,
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      creator: {
        select: {
          id: true,
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
};

const deleteEarningFromDB = async (id: string) => {
  return await (prisma as any).earning.delete({
    where: {
      id,
    },
  });
};

const getProjectEarningsFromMilestones = async (
  startDate?: string,
  endDate?: string
) => {
  const dateFilter: any = {};
  if (startDate) {
    dateFilter.paidAt = { gte: new Date(startDate) };
  }
  if (endDate) {
    dateFilter.paidAt = {
      ...(dateFilter.paidAt || {}),
      lte: new Date(endDate),
    };
  }

  // Get milestone payments grouped by project
  const payments = await prisma.milestonePayment.findMany({
    where: {
      ...dateFilter,
      status: "succeeded",
    },
    include: {
      milestone: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Group by project and sum amounts
  const projectEarningsMap = new Map<
    string,
    { projectId: string; projectName: string; totalAmount: number; count: number }
  >();

  payments.forEach((payment) => {
    const projectId = payment.milestone.project.id;
    const projectName = payment.milestone.project.name;
    const amount = Number(payment.amount);

    if (projectEarningsMap.has(projectId)) {
      const existing = projectEarningsMap.get(projectId)!;
      existing.totalAmount += amount;
      existing.count += 1;
    } else {
      projectEarningsMap.set(projectId, {
        projectId,
        projectName,
        totalAmount: amount,
        count: 1,
      });
    }
  });

  return Array.from(projectEarningsMap.values());
};

const getEarningStatsFromDB = async (startDate?: string, endDate?: string) => {
  const dateFilter: any = {};
  if (startDate) {
    dateFilter.date = { gte: new Date(startDate) };
  }
  if (endDate) {
    dateFilter.date = {
      ...dateFilter.date,
      lte: new Date(endDate),
    };
  }

  const [totalEarnings, earningsByProject, earningsByCategory] = await Promise.all([
    // Total earnings
    (prisma as any).earning.aggregate({
      where: Object.keys(dateFilter).length > 0 ? dateFilter : {},
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    }),

    // Earnings by project
    (prisma as any).earning.groupBy({
      by: ["projectId"],
      where: Object.keys(dateFilter).length > 0 ? dateFilter : {},
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    }),

    // Earnings by category
    (prisma as any).earning.groupBy({
      by: ["category"],
      where: Object.keys(dateFilter).length > 0 ? dateFilter : {},
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  // Get project names for earnings by project
  const earningsByProjectWithNames = await Promise.all(
    earningsByProject.map(async (item: { projectId: string | null; _sum: { amount: number | null }; _count: { id: number } }) => {
      if (item.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: item.projectId },
          select: { name: true },
        });
        return {
          projectId: item.projectId,
          projectName: project?.name || "Unknown",
          totalAmount: item._sum.amount || 0,
          count: item._count.id,
        };
      }
      return {
        projectId: null,
        projectName: "No Project",
        totalAmount: item._sum.amount || 0,
        count: item._count.id,
      };
    })
  );

  return {
    totalEarnings: totalEarnings._sum.amount || 0,
    totalCount: totalEarnings._count.id,
    earningsByProject: earningsByProjectWithNames,
    earningsByCategory: earningsByCategory.map((item: { category: string | null; _sum: { amount: number | null }; _count: { id: number } }) => ({
      category: item.category || "Uncategorized",
      totalAmount: item._sum.amount || 0,
      count: item._count.id,
    })),
  };
};

export const EarningService = {
  createEarningIntoDB,
  getAllEarningsFromDB,
  getSingleEarningFromDB,
  updateEarningIntoDB,
  deleteEarningFromDB,
  getEarningStatsFromDB,
  getProjectEarningsFromMilestones,
};

