import { Prisma, Service } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./service.constants";
import { IServiceFilterParams } from "./service.interface";

const createServiceIntoDB = async (
  data: Prisma.ServiceCreateInput
): Promise<Service> => {
  return await prisma.service.create({
    data,
  });
};

const getAllServiceFromDB = async (
  queryParams: IServiceFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.ServiceWhereInput[] = [];

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

  const result = await prisma.service.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.service.count({
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

const getSingleServiceFromDB = async (id: string): Promise<Service> => {
  return await prisma.service.findUniqueOrThrow({
    where: {
      id,
    },
  });
};

const updateServiceIntoDB = async (
  id: string,
  data: Partial<Service>
): Promise<Service> => {
  await prisma.service.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.service.update({
    where: {
      id,
    },
    data,
  });
};

const deleteServiceFromDB = async (id: string): Promise<Service> => {
  await prisma.service.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.service.delete({
    where: {
      id,
    },
  });
};

export const ServiceService = {
  createServiceIntoDB,
  getAllServiceFromDB,
  getSingleServiceFromDB,
  updateServiceIntoDB,
  deleteServiceFromDB,
};
