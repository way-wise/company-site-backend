import { Prisma, Partner } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./partner.constants";
import { IPartnerFilterParams } from "./partner.interface";

const createPartnerIntoDB = async (
  data: Prisma.PartnerCreateInput
): Promise<Partner> => {
  return await prisma.partner.create({
    data,
  });
};

const getAllPartnerFromDB = async (
  queryParams: IPartnerFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { search, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.PartnerWhereInput[] = [];

  //@ searching
  if (search) {
    const searchConditions = searchableFields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
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

  const result = await prisma.partner.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.partner.count({
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

const getPublicPartnersFromDB = async (): Promise<Partner[]> => {
  return await prisma.partner.findMany({
    where: {
      isShow: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getSinglePartnerFromDB = async (id: string): Promise<Partner> => {
  return await prisma.partner.findUniqueOrThrow({
    where: {
      id,
    },
  });
};

const updatePartnerIntoDB = async (
  id: string,
  data: Partial<Partner>
): Promise<Partner> => {
  await prisma.partner.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.partner.update({
    where: {
      id,
    },
    data,
  });
};

const togglePartnerIsShow = async (
  id: string,
  isShow: boolean
): Promise<Partner> => {
  await prisma.partner.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.partner.update({
    where: {
      id,
    },
    data: {
      isShow,
    },
  });
};

const deletePartnerFromDB = async (id: string): Promise<Partner> => {
  await prisma.partner.findUniqueOrThrow({
    where: {
      id,
    },
  });

  return await prisma.partner.delete({
    where: {
      id,
    },
  });
};

export const PartnerService = {
  createPartnerIntoDB,
  getAllPartnerFromDB,
  getPublicPartnersFromDB,
  getSinglePartnerFromDB,
  updatePartnerIntoDB,
  togglePartnerIsShow,
  deletePartnerFromDB,
};

