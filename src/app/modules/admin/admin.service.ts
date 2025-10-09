import { Prisma, UserProfile, UserStatus } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { IUserFilterParams } from "../user/user.interface";
import { searchableFields } from "./admin.constants";

const getAllAdminFomDB = async (
  queryParams: IUserFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.UserProfileWhereInput[] = [];

  // filtering out the soft deleted users
  conditions.push({
    isDeleted: false,
    user: {
      roles: {
        some: {
          role: {
            name: "ADMIN",
          },
        },
      },
    },
  });

  //@ searching
  if (q) {
    const searchConditions = searchableFields.map((field) => ({
      user: {
        [field]: { contains: q, mode: "insensitive" },
      },
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

  const result = await prisma.userProfile.findMany({
    where: { AND: conditions },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.userProfile.count({
    where: { AND: conditions },
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

const getSingleAdminFromDB = async (id: string) => {
  return await prisma.userProfile.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
      user: {
        roles: {
          some: {
            role: {
              name: "ADMIN",
            },
          },
        },
      },
    },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });
};

const updateAdminIntoDB = async (
  id: string,
  data: Partial<UserProfile>
): Promise<UserProfile> => {
  await prisma.userProfile.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
      user: {
        roles: {
          some: {
            role: {
              name: "ADMIN",
            },
          },
        },
      },
    },
  });

  return await prisma.userProfile.update({
    where: {
      id,
    },
    data,
  });
};
const deleteAdminFromDB = async (id: string): Promise<UserProfile> => {
  await prisma.userProfile.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
      user: {
        roles: {
          some: {
            role: {
              name: "ADMIN",
            },
          },
        },
      },
    },
  });

  return await prisma.$transaction(async (trClient) => {
    const deletedUserProfile = await trClient.userProfile.delete({
      where: {
        id,
      },
    });

    await trClient.user.delete({
      where: {
        id: deletedUserProfile.userId,
      },
    });

    return deletedUserProfile;
  });
};

const softDeleteAdminFromDB = async (
  id: string
): Promise<UserProfile | null> => {
  await prisma.userProfile.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
      user: {
        roles: {
          some: {
            role: {
              name: "ADMIN",
            },
          },
        },
      },
    },
  });

  return await prisma.$transaction(async (trClient) => {
    const userProfileDeletedData = await trClient.userProfile.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });

    await trClient.user.update({
      where: {
        id: userProfileDeletedData.userId,
      },
      data: {
        status: UserStatus.DELETED,
      },
    });

    return userProfileDeletedData;
  });
};

export const AdminService = {
  getAllAdminFomDB,
  getSingleAdminFromDB,
  updateAdminIntoDB,
  deleteAdminFromDB,
  softDeleteAdminFromDB,
};
