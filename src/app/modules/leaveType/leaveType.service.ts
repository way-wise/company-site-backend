import { Prisma } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { HTTPError } from "../../errors/HTTPError";
import httpStatus from "http-status";
import {
  ICreateLeaveType,
  ILeaveType,
  ILeaveTypeFilterParams,
  IUpdateLeaveType,
} from "./leaveType.interface";
import { searchableFields } from "./leaveType.constants";

const createLeaveType = async (
  data: ICreateLeaveType
): Promise<ILeaveType> => {
  const existingLeaveType = await prisma.leaveType.findUnique({
    where: { name: data.name },
  });

  if (existingLeaveType) {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "Leave type with this name already exists"
    );
  }

  return await prisma.leaveType.create({
    data: {
      name: data.name,
      description: data.description,
      defaultDaysPerYear: data.defaultDaysPerYear,
      requiresDocument: data.requiresDocument,
      color: data.color,
      isActive: data.isActive ?? true,
    },
  });
};

const getAllLeaveTypes = async (
  queryParams: ILeaveTypeFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
): Promise<{ result: ILeaveType[]; meta: any }> => {
  const { q, ...otherQueryParams } = queryParams;

  const { page, limit, skip, sortBy, sortOrder } =
    generatePaginateAndSortOptions(paginationAndSortingQueryParams);

  const conditions: Prisma.LeaveTypeWhereInput[] = [];

  // Searching
  if (q) {
    const searchConditions = searchableFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
    conditions.push({ OR: searchConditions });
  }

  // Filtering
  if (Object.keys(otherQueryParams).length > 0) {
    const filterData = Object.keys(otherQueryParams).map((key) => ({
      [key]: (otherQueryParams as any)[key],
    }));
    conditions.push(...filterData);
  }

  const whereConditions: Prisma.LeaveTypeWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  const result = await prisma.leaveType.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: sortBy && sortOrder ? { [sortBy]: sortOrder } : { name: "asc" },
  });

  const total = await prisma.leaveType.count({
    where: whereConditions,
  });

  return {
    result,
    meta: {
      page,
      limit,
      total,
    },
  };
};

const getActiveLeaveTypes = async (): Promise<ILeaveType[]> => {
  return await prisma.leaveType.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

const getSingleLeaveType = async (id: string): Promise<ILeaveType | null> => {
  return await prisma.leaveType.findUnique({
    where: { id },
  });
};

const updateLeaveType = async (
  id: string,
  data: IUpdateLeaveType
): Promise<ILeaveType> => {
  const existingLeaveType = await prisma.leaveType.findUnique({
    where: { id },
  });

  if (!existingLeaveType) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Leave type not found");
  }

  // Check if name is being updated and if it conflicts
  if (data.name && data.name !== existingLeaveType.name) {
    const nameConflict = await prisma.leaveType.findUnique({
      where: { name: data.name },
    });

    if (nameConflict) {
      throw new HTTPError(
        httpStatus.BAD_REQUEST,
        "Leave type with this name already exists"
      );
    }
  }

  return await prisma.leaveType.update({
    where: { id },
    data: {
      ...data,
    },
  });
};

const deleteLeaveType = async (id: string): Promise<ILeaveType> => {
  const existingLeaveType = await prisma.leaveType.findUnique({
    where: { id },
  });

  if (!existingLeaveType) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Leave type not found");
  }

  // Check if leave type is being used in any applications
  const applicationsCount = await prisma.leaveApplication.count({
    where: { leaveTypeId: id },
  });

  if (applicationsCount > 0) {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "Cannot delete leave type that has active applications"
    );
  }

  return await prisma.leaveType.delete({
    where: { id },
  });
};

const toggleLeaveTypeStatus = async (id: string): Promise<ILeaveType> => {
  const existingLeaveType = await prisma.leaveType.findUnique({
    where: { id },
  });

  if (!existingLeaveType) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Leave type not found");
  }

  return await prisma.leaveType.update({
    where: { id },
    data: {
      isActive: !existingLeaveType.isActive,
    },
  });
};

export const LeaveTypeService = {
  createLeaveType,
  getAllLeaveTypes,
  getActiveLeaveTypes,
  getSingleLeaveType,
  updateLeaveType,
  deleteLeaveType,
  toggleLeaveTypeStatus,
};

