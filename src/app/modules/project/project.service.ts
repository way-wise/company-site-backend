import { Prisma, Project } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./project.constants";
import { IProjectFilterParams } from "./project.interface";

const createProjectIntoDB = async (data: {
  name: string;
  description?: string;
  status?: string;
  userProfileId: string;
}): Promise<Project> => {
  // Validate that userProfileId exists
  const userProfile = await prisma.userProfile.findUnique({
    where: { id: data.userProfileId },
  });

  if (!userProfile) {
    throw new Error(`UserProfile with id ${data.userProfileId} not found`);
  }

  return await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      status: data.status as any,
      userProfileId: data.userProfileId,
    },
  });
};

const getAllProjectsFromDB = async (
  queryParams: IProjectFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.ProjectWhereInput[] = [];

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

  const result = await prisma.project.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      userProfile: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      milestones: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      _count: {
        select: {
          milestones: true,
        },
      },
    },
  });

  const total = await prisma.project.count({
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

const getSingleProjectFromDB = async (id: string) => {
  return await prisma.project.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      userProfile: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      milestones: {
        include: {
          employeeMilestones: {
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
          serviceMilestones: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          Task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              progress: true,
            },
          },
        },
      },
    },
  });
};

const updateProjectIntoDB = async (
  id: string,
  data: Partial<Project>
): Promise<Project> => {
  await prisma.project.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.project.update({
    where: {
      id,
    },
    data,
  });
};

const deleteProjectFromDB = async (id: string): Promise<Project> => {
  await prisma.project.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.project.delete({
    where: {
      id,
    },
  });
};

export const ProjectService = {
  createProjectIntoDB,
  getAllProjectsFromDB,
  getSingleProjectFromDB,
  updateProjectIntoDB,
  deleteProjectFromDB,
};
