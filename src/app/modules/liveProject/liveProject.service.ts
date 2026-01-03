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
  projectBudget: number | Decimal | null | undefined,
  paidAmount: number | Decimal | null | undefined
): Decimal | null => {
  // For HOURLY projects, return null
  if (projectBudget === null || projectBudget === undefined) {
    return null;
  }
  if (paidAmount === null || paidAmount === undefined) {
    return null;
  }
  
  const budget = typeof projectBudget === "number" ? projectBudget : Number(projectBudget);
  const paid = typeof paidAmount === "number" ? paidAmount : Number(paidAmount);
  return new Decimal(Math.max(0, budget - paid));
};

const createLiveProjectIntoDB = async (data: {
  clientName: string;
  clientLocation?: string;
  projectType: "FIXED" | "HOURLY";
  projectBudget?: number | null;
  paidAmount?: number | null;
  assignedMembers: string[];
  projectStatus?: "PENDING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
  dailyNotes?: IDailyNote[];
  nextActions?: string;
}): Promise<LiveProject> => {

  // Handle FIXED vs HOURLY projects
  let projectBudget: Decimal | null = null;
  let paidAmountDecimal: Decimal | null = null;
  let dueAmount: Decimal | null = null;

  if (data.projectType === "FIXED") {
    if (data.projectBudget === undefined || data.projectBudget === null) {
      throw new Error("Project budget is required for FIXED projects");
    }
    const paidAmount = data.paidAmount ?? 0;
    projectBudget = new Decimal(data.projectBudget);
    paidAmountDecimal = new Decimal(paidAmount);
    dueAmount = calculateDueAmount(projectBudget, paidAmountDecimal);
  } else {
    // HOURLY projects don't have budget/paid/due amounts
    projectBudget = null;
    paidAmountDecimal = null;
    dueAmount = null;
  }

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
    projectBudget: number | null;
    paidAmount: number | null;
    assignedMembers: string;
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


  // Determine the project type (use updated value if provided, otherwise existing)
  const projectType = data.projectType ?? existingProject.projectType;
  const isChangingToHOURLY = data.projectType === "HOURLY" || (data.projectType === undefined && existingProject.projectType === "HOURLY");
  const isChangingToFIXED = data.projectType === "FIXED" || (data.projectType === undefined && existingProject.projectType === "FIXED");

  // Calculate projectBudget, paidAmount, and dueAmount based on project type
  let projectBudget: Decimal | null = null;
  let paidAmount: Decimal | null = null;
  let dueAmount: Decimal | null = null;

  if (projectType === "FIXED") {
    // For FIXED projects, budget and paid amount are required
    if (data.projectBudget !== undefined) {
      if (data.projectBudget === null) {
        throw new Error("Project budget cannot be null for FIXED projects");
      }
      projectBudget = new Decimal(data.projectBudget);
    } else {
      // If changing from HOURLY to FIXED, budget is required
      if (existingProject.projectType === "HOURLY") {
        throw new Error("Project budget is required when changing project type to FIXED");
      }
      projectBudget = existingProject.projectBudget;
    }

    if (data.paidAmount !== undefined) {
      if (data.paidAmount === null) {
        throw new Error("Paid amount cannot be null for FIXED projects");
      }
      paidAmount = new Decimal(data.paidAmount);
    } else {
      // If changing from HOURLY to FIXED, paidAmount is required
      if (existingProject.projectType === "HOURLY") {
        throw new Error("Paid amount is required when changing project type to FIXED");
      }
      paidAmount = existingProject.paidAmount;
    }

    // Calculate dueAmount for FIXED projects
    if (projectBudget !== null && paidAmount !== null) {
      dueAmount = calculateDueAmount(projectBudget, paidAmount);
    }
  } else {
    // For HOURLY projects, set all to null
    projectBudget = null;
    paidAmount = null;
    dueAmount = null;
  }

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
    dueAmount,
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

