import { Permission, Prisma } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./permission.constants";
import {
  ICreatePermission,
  IPermissionFilterParams,
  IUpdatePermission,
} from "./permission.interface";

const getAllPermissions = async (
  queryParams: IPermissionFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.PermissionWhereInput[] = [];

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

  const result = await prisma.permission.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      _count: {
        select: {
          rolePermissions: true,
        },
      },
    },
  });

  const total = await prisma.permission.count({
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

const getSinglePermission = async (id: string) => {
  const permission = await prisma.permission.findUniqueOrThrow({
    where: { id },
    include: {
      rolePermissions: {
        include: {
          role: true,
        },
      },
    },
  });

  return permission;
};

const createPermission = async (
  data: ICreatePermission
): Promise<Permission> => {
  // Check if permission with same name already exists
  const existingPermission = await prisma.permission.findUnique({
    where: { name: data.name },
  });

  if (existingPermission) {
    throw new Error("Permission with this name already exists");
  }

  const permission = await prisma.permission.create({
    data,
  });

  return permission;
};

const updatePermission = async (
  id: string,
  data: IUpdatePermission
): Promise<Permission> => {
  // Check if permission exists
  await prisma.permission.findUniqueOrThrow({
    where: { id },
  });

  // If updating name, check for duplicates
  if (data.name) {
    const existingPermission = await prisma.permission.findFirst({
      where: {
        name: data.name,
        NOT: { id },
      },
    });

    if (existingPermission) {
      throw new Error("Permission with this name already exists");
    }
  }

  const permission = await prisma.permission.update({
    where: { id },
    data,
  });

  return permission;
};

const deletePermission = async (id: string) => {
  // Check if permission exists
  await prisma.permission.findUniqueOrThrow({
    where: { id },
  });

  // Delete permission (cascade will handle rolePermissions)
  await prisma.permission.delete({
    where: { id },
  });

  return { message: "Permission deleted successfully" };
};

const getPermissionGroups = async () => {
  const groups = await prisma.permission.findMany({
    select: {
      group: true,
    },
    distinct: ["group"],
  });

  return groups.map((g) => g.group);
};

export const permissionService = {
  getAllPermissions,
  getSinglePermission,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionGroups,
};
