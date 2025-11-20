import { Prisma } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./expense.constants";
import { IExpenseFilterParams } from "./expense.interface";

const createExpenseIntoDB = async (data: {
  amount: number;
  description?: string;
  date: Date | string;
  category?: string;
  receiptUrl?: string;
  createdBy: string;
}) => {
  // Validate that userProfileId exists
  const userProfile = await prisma.userProfile.findUnique({
    where: { id: data.createdBy },
  });

  if (!userProfile) {
    throw new Error(`UserProfile with id ${data.createdBy} not found`);
  }

  const dateValue = typeof data.date === "string" ? new Date(data.date) : data.date;

  return await (prisma as any).expense.create({
    data: {
      amount: data.amount,
      description: data.description,
      date: dateValue,
      category: data.category,
      receiptUrl: data.receiptUrl || null,
      createdBy: data.createdBy,
    },
    include: {
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

const getAllExpensesFromDB = async (
  queryParams: IExpenseFilterParams,
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

  const result = await (prisma as any).expense.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
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

  const total = await (prisma as any).expense.count({
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

const getSingleExpenseFromDB = async (id: string) => {
  return await (prisma as any).expense.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
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

const updateExpenseIntoDB = async (
  id: string,
  data: {
    amount?: number;
    description?: string;
    date?: Date | string;
    category?: string;
    receiptUrl?: string | null;
  }
) => {
  await (prisma as any).expense.findUniqueOrThrow({
    where: {
      id,
    },
  });

  const updateData: any = { ...data };
  if (data.date) {
    updateData.date = typeof data.date === "string" ? new Date(data.date) : data.date;
  }

  return await (prisma as any).expense.update({
    where: {
      id,
    },
    data: updateData,
    include: {
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

const deleteExpenseFromDB = async (id: string) => {
  return await (prisma as any).expense.delete({
    where: {
      id,
    },
  });
};

const getExpenseStatsFromDB = async (startDate?: string, endDate?: string) => {
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

  const [totalExpenses, expensesByCategory] = await Promise.all([
    // Total expenses
    (prisma as any).expense.aggregate({
      where: Object.keys(dateFilter).length > 0 ? dateFilter : {},
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    }),

    // Expenses by category
    (prisma as any).expense.groupBy({
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

  return {
    totalExpenses: totalExpenses._sum.amount || 0,
    totalCount: totalExpenses._count.id,
    expensesByCategory: expensesByCategory.map((item: { category: string | null; _sum: { amount: number | null }; _count: { id: number } }) => ({
      category: item.category || "Uncategorized",
      totalAmount: item._sum.amount || 0,
      count: item._count.id,
    })),
  };
};

export const ExpenseService = {
  createExpenseIntoDB,
  getAllExpensesFromDB,
  getSingleExpenseFromDB,
  updateExpenseIntoDB,
  deleteExpenseFromDB,
  getExpenseStatsFromDB,
};

