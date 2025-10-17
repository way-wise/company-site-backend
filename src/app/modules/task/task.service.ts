import { Prisma, Task } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./task.constants";
import { ITaskFilterParams } from "./task.interface";

const createTaskIntoDB = async (
  data: Prisma.TaskCreateInput
): Promise<Task> => {
  // Filter out undefined values to avoid foreign key constraint issues
  const cleanedData = Object.fromEntries(
    Object.entries(data).filter(
      ([_, value]) => value !== undefined && value !== null && value !== ""
    )
  ) as Prisma.TaskCreateInput;

  console.log("Cleaned data for DB:", cleanedData);

  return await prisma.task.create({
    data: cleanedData,
  });
};

const getAllTasksFromDB = async (
  queryParams: ITaskFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.TaskWhereInput[] = [];

  //@ searching
  if (q) {
    const searchConditions = searchableFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
    conditions.push({ OR: searchConditions });
  }

  //@ filtering with exact value
  if (Object.keys(otherQueryParams).length > 0) {
    const filterData = Object.keys(otherQueryParams).map((key) => ({
      [key]: (otherQueryParams as any)[key],
    }));
    conditions.push(...filterData);
  }

  const result = await prisma.task.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      milestone: {
        select: {
          id: true,
          name: true,
          status: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
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
      assignments: {
        include: {
          userProfile: {
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
      },
      _count: {
        select: {
          comments: true,
          assignments: true,
        },
      },
    },
  });

  const total = await prisma.task.count({
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

const getSingleTaskFromDB = async (id: string) => {
  return await prisma.task.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      milestone: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
            },
          },
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
      assignments: {
        include: {
          userProfile: {
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
      },
      comments: {
        include: {
          userProfile: {
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
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
};

const updateTaskIntoDB = async (
  id: string,
  data: Partial<Task>
): Promise<Task> => {
  await prisma.task.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.task.update({
    where: {
      id,
    },
    data,
  });
};

const deleteTaskFromDB = async (id: string): Promise<Task> => {
  await prisma.task.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.task.delete({
    where: {
      id,
    },
  });
};

const assignEmployeesToTask = async (
  taskId: string,
  userProfileIds: string[],
  roles?: string[]
) => {
  // First verify task exists
  await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
  });

  // Delete existing assignments
  await prisma.taskAssignment.deleteMany({
    where: { taskId },
  });

  // Create new assignments
  const assignments = userProfileIds.map((userProfileId, index) => ({
    taskId,
    userProfileId,
    role: roles?.[index] || null,
  }));

  await prisma.taskAssignment.createMany({
    data: assignments,
  });

  return await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignments: {
        include: {
          userProfile: {
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
      },
    },
  });
};

const addCommentToTask = async (
  taskId: string,
  userProfileId: string,
  content: string
) => {
  // First verify task exists
  await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
  });

  return await prisma.taskComment.create({
    data: {
      taskId,
      userProfileId,
      content,
    },
    include: {
      userProfile: {
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

const updateTaskProgress = async (taskId: string, progress: number) => {
  await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
  });

  return await prisma.task.update({
    where: { id: taskId },
    data: { progress },
  });
};

const updateTaskTimeTracking = async (taskId: string, spentHours: number) => {
  await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
  });

  return await prisma.task.update({
    where: { id: taskId },
    data: { spentHours },
  });
};

export const TaskService = {
  createTaskIntoDB,
  getAllTasksFromDB,
  getSingleTaskFromDB,
  updateTaskIntoDB,
  deleteTaskFromDB,
  assignEmployeesToTask,
  addCommentToTask,
  updateTaskProgress,
  updateTaskTimeTracking,
};
