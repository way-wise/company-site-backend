import { Milestone, Prisma } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./milestone.constants";
import { IMilestoneFilterParams } from "./milestone.interface";

const createMilestoneIntoDB = async (
  data: Prisma.MilestoneCreateInput
): Promise<Milestone> => {
  return await prisma.milestone.create({
    data,
  });
};

const getAllMilestonesFromDB = async (
  queryParams: IMilestoneFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.MilestoneWhereInput[] = [];

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

  const result = await prisma.milestone.findMany({
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
          status: true,
        },
      },
      _count: {
        select: {
          employeeMilestones: true,
          serviceMilestones: true,
          Task: true,
        },
      },
    },
  });

  const total = await prisma.milestone.count({
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

const getSingleMilestoneFromDB = async (id: string) => {
  return await prisma.milestone.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
        },
      },
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
              image: true,
              description: true,
            },
          },
        },
      },
      Task: {
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
      },
    },
  });
};

const updateMilestoneIntoDB = async (
  id: string,
  data: Partial<Milestone>
): Promise<Milestone> => {
  await prisma.milestone.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.milestone.update({
    where: {
      id,
    },
    data,
  });
};

const deleteMilestoneFromDB = async (id: string): Promise<Milestone> => {
  await prisma.milestone.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.milestone.delete({
    where: {
      id,
    },
  });
};

const assignEmployeesToMilestone = async (
  milestoneId: string,
  userProfileIds: string[]
) => {
  // First verify milestone exists
  await prisma.milestone.findUniqueOrThrow({
    where: { id: milestoneId },
  });

  // Delete existing assignments
  await prisma.employeeMilestone.deleteMany({
    where: { milestoneId },
  });

  // Create new assignments
  const assignments = userProfileIds.map((userProfileId) => ({
    milestoneId,
    userProfileId,
  }));

  await prisma.employeeMilestone.createMany({
    data: assignments,
  });

  return await prisma.milestone.findUnique({
    where: { id: milestoneId },
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
    },
  });
};

const assignServicesToMilestone = async (
  milestoneId: string,
  serviceIds: string[]
) => {
  // First verify milestone exists
  await prisma.milestone.findUniqueOrThrow({
    where: { id: milestoneId },
  });

  // Delete existing assignments
  await prisma.serviceMilestone.deleteMany({
    where: { milestoneId },
  });

  // Create new assignments
  const assignments = serviceIds.map((serviceId) => ({
    milestoneId,
    serviceId,
  }));

  await prisma.serviceMilestone.createMany({
    data: assignments,
  });

  return await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      serviceMilestones: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              image: true,
              description: true,
            },
          },
        },
      },
    },
  });
};

export const MilestoneService = {
  createMilestoneIntoDB,
  getAllMilestonesFromDB,
  getSingleMilestoneFromDB,
  updateMilestoneIntoDB,
  deleteMilestoneFromDB,
  assignEmployeesToMilestone,
  assignServicesToMilestone,
};



