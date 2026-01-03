import { Prisma, LiveProject } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./liveProject.constants";
import { IDailyNote, ILiveProjectFilterParams } from "./liveProject.interface";

const calculateDueAmount = (
  projectBudget: number | Decimal,
  paidAmount: number | Decimal
): Decimal => {
  const budget = typeof projectBudget === "number" ? projectBudget : Number(projectBudget);
  const paid = typeof paidAmount === "number" ? paidAmount : Number(paidAmount);
  return new Decimal(Math.max(0, budget - paid));
};

const createLiveProjectIntoDB = async (data: {
  clientName: string;
  clientLocation?: string;
  projectType: "FIXED" | "HOURLY";
  projectBudget: number;
  paidAmount?: number;
  assignedMembers: string[];
  projectStatus?: "PENDING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
  dailyNotes?: IDailyNote[];
  nextActions?: string;
}): Promise<LiveProject> => {
  // Validate assigned members exist
  if (data.assignedMembers && data.assignedMembers.length > 0) {
    const userProfiles = await prisma.userProfile.findMany({
      where: {
        id: {
          in: data.assignedMembers,
        },
      },
    });

    if (userProfiles.length !== data.assignedMembers.length) {
      const foundIds = userProfiles.map((up) => up.id);
      const missingIds = data.assignedMembers.filter(
        (id) => !foundIds.includes(id)
      );
      throw new Error(
        `Invalid assigned member IDs: ${missingIds.join(", ")}`
      );
    }
  }

  const paidAmount = data.paidAmount ?? 0;
  const projectBudget = new Decimal(data.projectBudget);
  const paidAmountDecimal = new Decimal(paidAmount);
  const dueAmount = calculateDueAmount(projectBudget, paidAmountDecimal);

  // Initialize dailyNotes with createdAt if provided
  const dailyNotes = data.dailyNotes
    ? data.dailyNotes.map((note) => ({
        ...note,
        createdAt: note.createdAt || new Date().toISOString(),
      }))
    : [];

  return await prisma.liveProject.create({
    data: {
      clientName: data.clientName,
      clientLocation: data.clientLocation,
      projectType: data.projectType,
      projectBudget,
      paidAmount: paidAmountDecimal,
      dueAmount,
      assignedMembers: data.assignedMembers,
      projectStatus: data.projectStatus || "PENDING",
      dailyNotes: dailyNotes.length > 0 ? dailyNotes : undefined,
      nextActions: data.nextActions,
    },
  });
};

const getAllLiveProjectsFromDB = async (
  queryParams: ILiveProjectFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.LiveProjectWhereInput[] = [];

  // Searching
  if (q) {
    const searchConditions = searchableFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
    conditions.push({ OR: searchConditions });
  }

  // Filtering with exact value
  if (Object.keys(otherQueryParams).length > 0) {
    const filterData = Object.keys(otherQueryParams).map((key) => ({
      [key]: (otherQueryParams as any)[key],
    }));
    conditions.push(...filterData);
  }

  const result = await prisma.liveProject.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.liveProject.count({
    where: conditions.length > 0 ? { AND: conditions } : {},
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleLiveProjectFromDB = async (id: string) => {
  return await prisma.liveProject.findUniqueOrThrow({
    where: {
      id,
    },
  });
};

const updateLiveProjectIntoDB = async (
  id: string,
  data: Partial<{
    clientName: string;
    clientLocation: string;
    projectType: "FIXED" | "HOURLY";
    projectBudget: number;
    paidAmount: number;
    assignedMembers: string[];
    projectStatus: "PENDING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
    dailyNotes: IDailyNote[];
    nextActions: string;
  }>
): Promise<LiveProject> => {
  const existingProject = await prisma.liveProject.findUniqueOrThrow({
    where: {
      id,
    },
  });

  // Validate assigned members if provided
  if (data.assignedMembers && data.assignedMembers.length > 0) {
    const userProfiles = await prisma.userProfile.findMany({
      where: {
        id: {
          in: data.assignedMembers,
        },
      },
    });

    if (userProfiles.length !== data.assignedMembers.length) {
      const foundIds = userProfiles.map((up) => up.id);
      const missingIds = data.assignedMembers.filter(
        (id) => !foundIds.includes(id)
      );
      throw new Error(
        `Invalid assigned member IDs: ${missingIds.join(", ")}`
      );
    }
  }

  // Calculate dueAmount - always recalculate
  const projectBudget =
    data.projectBudget !== undefined
      ? new Decimal(data.projectBudget)
      : existingProject.projectBudget;
  const paidAmount =
    data.paidAmount !== undefined
      ? new Decimal(data.paidAmount)
      : existingProject.paidAmount;
  const dueAmount = calculateDueAmount(projectBudget, paidAmount);

  // Handle dailyNotes - append only, don't overwrite
  let dailyNotes: IDailyNote[] = [];
  if (data.dailyNotes) {
    // Get existing notes
    const existingNotes =
      (existingProject.dailyNotes as IDailyNote[] | null) || [];
    // Append new notes with createdAt
    const newNotes = data.dailyNotes.map((note) => ({
      ...note,
      createdAt: note.createdAt || new Date().toISOString(),
    }));
    dailyNotes = [...existingNotes, ...newNotes];
  } else {
    // Keep existing notes if not provided
    dailyNotes =
      (existingProject.dailyNotes as IDailyNote[] | null) || [];
  }

  const updateData: Prisma.LiveProjectUpdateInput = {
    ...(data.clientName !== undefined && { clientName: data.clientName }),
    ...(data.clientLocation !== undefined && {
      clientLocation: data.clientLocation,
    }),
    ...(data.projectType !== undefined && { projectType: data.projectType }),
    projectBudget,
    paidAmount,
    dueAmount, // Always update dueAmount
    ...(data.assignedMembers !== undefined && {
      assignedMembers: data.assignedMembers,
    }),
    ...(data.projectStatus !== undefined && {
      projectStatus: data.projectStatus,
    }),
    dailyNotes,
    ...(data.nextActions !== undefined && { nextActions: data.nextActions }),
  };

  return await prisma.liveProject.update({
    where: {
      id,
    },
    data: updateData,
  });
};

const addDailyNoteToLiveProject = async (
  id: string,
  note: string
): Promise<LiveProject> => {
  const existingProject = await prisma.liveProject.findUniqueOrThrow({
    where: {
      id,
    },
  });

  const existingNotes =
    (existingProject.dailyNotes as IDailyNote[] | null) || [];
  const newNote: IDailyNote = {
    note,
    createdAt: new Date().toISOString(),
  };

  const updatedNotes = [...existingNotes, newNote];

  return await prisma.liveProject.update({
    where: {
      id,
    },
    data: {
      dailyNotes: updatedNotes,
    },
  });
};

const deleteLiveProjectFromDB = async (id: string): Promise<LiveProject> => {
  return await prisma.liveProject.delete({
    where: {
      id,
    },
  });
};

export const LiveProjectService = {
  createLiveProjectIntoDB,
  getAllLiveProjectsFromDB,
  getSingleLiveProjectFromDB,
  updateLiveProjectIntoDB,
  addDailyNoteToLiveProject,
  deleteLiveProjectFromDB,
};

