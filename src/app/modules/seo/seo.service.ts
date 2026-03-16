import { Prisma, SeoSetting } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { ISeoFilterRequest, ISeoCreateInput, ISeoUpdateInput } from "./seo.interface";

const createSeo = async (data: ISeoCreateInput): Promise<SeoSetting> => {
  const result = await prisma.seoSetting.create({
    data: {
      ...data,
      keywords: data.keywords ? (data.keywords as unknown as Prisma.JsonArray) : [],
    },
  });
  return result;
};

const getAllSeoSettings = async (
  filters: ISeoFilterRequest,
  options: IPaginationParams & ISortingParams
) => {
  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.SeoSettingWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: ["pageName", "pageSlug", "metaTitle", "metaDescription"].map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as Record<string, unknown>)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.SeoSettingWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.seoSetting.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.seoSetting.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const getSingleSeo = async (id: string): Promise<SeoSetting | null> => {
  const result = await prisma.seoSetting.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const getSeoBySlug = async (pageSlug: string): Promise<SeoSetting | null> => {
  const result = await prisma.seoSetting.findFirst({
    where: {
      pageSlug,
      isActive: true,
    },
  });
  return result;
};

const updateSeo = async (id: string, payload: ISeoUpdateInput): Promise<SeoSetting> => {
  const result = await prisma.seoSetting.update({
    where: {
      id,
    },
    data: {
      ...payload,
      keywords: payload.keywords ? (payload.keywords as unknown as Prisma.JsonArray) : undefined,
    },
  });
  return result;
};

const deleteSeo = async (id: string): Promise<SeoSetting> => {
  const result = await prisma.seoSetting.delete({
    where: {
      id,
    },
  });
  return result;
};

const upsertSeo = async (pageSlug: string, data: ISeoCreateInput): Promise<SeoSetting> => {
  const result = await prisma.seoSetting.upsert({
    where: {
      pageSlug,
    },
    update: {
      ...data,
      keywords: data.keywords ? (data.keywords as unknown as Prisma.JsonArray) : [],
    },
    create: {
      ...data,
      keywords: data.keywords ? (data.keywords as unknown as Prisma.JsonArray) : [],
    },
  });
  return result;
};

export const SeoService = {
  createSeo,
  getAllSeoSettings,
  getSingleSeo,
  getSeoBySlug,
  updateSeo,
  deleteSeo,
  upsertSeo,
};
