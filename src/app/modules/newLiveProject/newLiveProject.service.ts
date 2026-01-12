import { Prisma, NewLiveProject, NewProjectAction, NewHourLog } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./newLiveProject.constants";
import {
  INewLiveProjectFilterParams,
  IDocument,
  ITargetedDeadline,
} from "./newLiveProject.interface";

/**
 * Calculate due amount for FIXED projects
 * Formula: dueAmount = projectBudget - paidAmount
 */
const calculateDueAmount = (
  projectBudget: number | Decimal | null | undefined,
  paidAmount: number | Decimal | null | undefined
): Decimal | null => {
  if (projectBudget === null || projectBudget === undefined) {
    return null;
  }
  if (paidAmount === null || paidAmount === undefined) {
    return null;
  }

  const budget =
    typeof projectBudget === "number" ? projectBudget : Number(projectBudget);
  const paid = typeof paidAmount === "number" ? paidAmount : Number(paidAmount);
  return new Decimal(Math.max(0, budget - paid));
};

/**
 * Create a new live project
 */
const createNewLiveProjectIntoDB = async (data: {
  projectName: string;
  clientName?: string;
  clientLocation?: string;
  assignedMembers: string[];
  projectType: "FIXED" | "HOURLY";
  projectBudget?: number | null;
  paidAmount?: number | null;
  weeklyLimit?: number | null;
  committedDeadline?: string | null;
  targetedDeadline?: ITargetedDeadline | null;
  documents?: IDocument[];
  createdBy: string;
  projectStatus?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCEL" | "ARCHIVED";
}): Promise<NewLiveProject> => {
  // Handle FIXED vs HOURLY projects
  let projectBudget: Decimal | null = null;
  let paidAmountDecimal: Decimal | null = null;
  let dueAmount: Decimal | null = null;
  let weeklyLimit: Decimal | null = null;

  if (data.projectType === "FIXED") {
    if (data.projectBudget === undefined || data.projectBudget === null) {
      throw new Error("Project budget is required for FIXED projects");
    }
    const paidAmount = data.paidAmount ?? 0;
    projectBudget = new Decimal(data.projectBudget);
    paidAmountDecimal = new Decimal(paidAmount);
    dueAmount = calculateDueAmount(projectBudget, paidAmountDecimal);
    weeklyLimit = null;
  } else {
    // HOURLY projects
    if (data.weeklyLimit === undefined || data.weeklyLimit === null) {
      throw new Error("Weekly limit is required for HOURLY projects");
    }
    weeklyLimit = new Decimal(data.weeklyLimit);
    projectBudget = null;
    paidAmountDecimal = null;
    dueAmount = null;
  }

  // Parse committed deadline
  const committedDeadlineDate = data.committedDeadline
    ? new Date(data.committedDeadline)
    : null;

  // Parse targeted deadline
  let targetedDeadlineJson: ITargetedDeadline | null = null;
  if (data.targetedDeadline) {
    targetedDeadlineJson = {
      backend: data.targetedDeadline.backend || null,
      frontend: data.targetedDeadline.frontend || null,
      ui: data.targetedDeadline.ui || null,
    };
  }

  // Initialize documents array
  const documents = data.documents || [];

  return await prisma.newLiveProject.create({
    data: {
      projectName: data.projectName,
      clientName: data.clientName,
      clientLocation: data.clientLocation,
      assignedMembers: data.assignedMembers,
      projectType: data.projectType,
      projectStatus: data.projectStatus || "PENDING",
      projectBudget,
      paidAmount: paidAmountDecimal,
      dueAmount,
      weeklyLimit,
      committedDeadline: committedDeadlineDate,
      targetedDeadline: targetedDeadlineJson,
      documents,
      createdBy: data.createdBy,
    },
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
    },
  });
};

/**
 * Get all new live projects with filtering, searching, and pagination
 */
const getAllNewLiveProjectsFromDB = async (
  queryParams: INewLiveProjectFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.NewLiveProjectWhereInput[] = [];

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

  const result = await prisma.newLiveProject.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
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
    },
  });

  const total = await prisma.newLiveProject.count({
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

/**
 * Get a single new live project by ID
 */
const getSingleNewLiveProjectFromDB = async (id: string) => {
  return await prisma.newLiveProject.findUniqueOrThrow({
    where: {
      id,
    },
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
    },
  });
};

/**
 * Update a new live project
 */
const updateNewLiveProjectIntoDB = async (
  id: string,
  data: Partial<{
    projectName: string;
    clientName: string;
    clientLocation: string;
    assignedMembers: string[];
    projectType: "FIXED" | "HOURLY";
    projectBudget: number | null;
    paidAmount: number | null;
    weeklyLimit: number | null;
    committedDeadline: string | null;
    targetedDeadline: ITargetedDeadline | null;
    projectStatus: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCEL" | "ARCHIVED";
  }>
): Promise<NewLiveProject> => {
  const existingProject = await prisma.newLiveProject.findUniqueOrThrow({
    where: {
      id,
    },
  });

  // Determine the project type (use updated value if provided, otherwise existing)
  const projectType = data.projectType ?? existingProject.projectType;

  // Calculate projectBudget, paidAmount, dueAmount, and weeklyLimit based on project type
  let projectBudget: Decimal | null = null;
  let paidAmount: Decimal | null = null;
  let dueAmount: Decimal | null = null;
  let weeklyLimit: Decimal | null = null;

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
        throw new Error(
          "Project budget is required when changing project type to FIXED"
        );
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
        throw new Error(
          "Paid amount is required when changing project type to FIXED"
        );
      }
      paidAmount = existingProject.paidAmount;
    }

    // Calculate dueAmount for FIXED projects
    if (projectBudget !== null && paidAmount !== null) {
      dueAmount = calculateDueAmount(projectBudget, paidAmount);
    }

    weeklyLimit = null;
  } else {
    // For HOURLY projects
    if (data.weeklyLimit !== undefined) {
      if (data.weeklyLimit === null) {
        throw new Error("Weekly limit cannot be null for HOURLY projects");
      }
      weeklyLimit = new Decimal(data.weeklyLimit);
    } else {
      // If changing from FIXED to HOURLY, weeklyLimit is required
      if (existingProject.projectType === "FIXED") {
        throw new Error(
          "Weekly limit is required when changing project type to HOURLY"
        );
      }
      weeklyLimit = existingProject.weeklyLimit;
    }

    projectBudget = null;
    paidAmount = null;
    dueAmount = null;
  }

  // Parse committed deadline if provided
  const committedDeadlineDate =
    data.committedDeadline !== undefined
      ? data.committedDeadline
        ? new Date(data.committedDeadline)
        : null
      : existingProject.committedDeadline;

  // Parse targeted deadline if provided
  let targetedDeadlineJson: ITargetedDeadline | null = null;
  if (data.targetedDeadline !== undefined) {
    targetedDeadlineJson = {
      backend: data.targetedDeadline.backend || null,
      frontend: data.targetedDeadline.frontend || null,
      ui: data.targetedDeadline.ui || null,
    };
  } else {
    targetedDeadlineJson = existingProject.targetedDeadline as ITargetedDeadline | null;
  }

  const updateData: Prisma.NewLiveProjectUpdateInput = {
    ...(data.projectName !== undefined && { projectName: data.projectName }),
    ...(data.clientName !== undefined && { clientName: data.clientName }),
    ...(data.clientLocation !== undefined && {
      clientLocation: data.clientLocation,
    }),
    ...(data.assignedMembers !== undefined && {
      assignedMembers: data.assignedMembers,
    }),
    ...(data.projectType !== undefined && { projectType: data.projectType }),
    ...(data.projectStatus !== undefined && {
      projectStatus: data.projectStatus,
    }),
    projectBudget,
    paidAmount,
    dueAmount,
    weeklyLimit,
    ...(data.committedDeadline !== undefined && {
      committedDeadline: committedDeadlineDate,
    }),
    ...(data.targetedDeadline !== undefined && {
      targetedDeadline: targetedDeadlineJson,
    }),
  };

  return await prisma.newLiveProject.update({
    where: {
      id,
    },
    data: updateData,
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
    },
  });
};

/**
 * Soft delete a new live project (set status to ARCHIVED)
 */
const deleteNewLiveProjectFromDB = async (
  id: string
): Promise<NewLiveProject> => {
  // Soft delete by setting status to ARCHIVED
  return await prisma.newLiveProject.update({
    where: {
      id,
    },
    data: {
      projectStatus: "ARCHIVED",
    },
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
    },
  });
};

/**
 * Upload document to a project (append to documents array)
 */
const uploadDocumentToProject = async (
  projectId: string,
  document: IDocument
): Promise<NewLiveProject> => {
  const existingProject = await prisma.newLiveProject.findUniqueOrThrow({
    where: {
      id: projectId,
    },
  });

  // Get existing documents
  const existingDocuments =
    (existingProject.documents as IDocument[] | null) || [];

  // Append new document (never overwrite existing documents)
  const updatedDocuments = [...existingDocuments, document];

  return await prisma.newLiveProject.update({
    where: {
      id: projectId,
    },
    data: {
      documents: updatedDocuments,
    },
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
    },
  });
};

/**
 * Create a project action
 */
const createProjectActionIntoDB = async (data: {
  projectId: string;
  actionText: string;
  actionDate?: string;
  createdBy: string;
}): Promise<NewProjectAction> => {
  const actionDate = data.actionDate ? new Date(data.actionDate) : new Date();

  return await prisma.newProjectAction.create({
    data: {
      projectId: data.projectId,
      actionText: data.actionText,
      actionDate,
      createdBy: data.createdBy,
    },
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
    },
  });
};

/**
 * Get all actions for a project
 */
const getProjectActionsFromDB = async (projectId: string) => {
  return await prisma.newProjectAction.findMany({
    where: {
      projectId,
    },
    orderBy: {
      actionDate: "desc", // Latest action first
    },
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
    },
  });
};

/**
 * Create an hour log for hourly projects
 */
const createHourLogIntoDB = async (data: {
  projectId: string;
  userId: string;
  date: string;
  submittedHours: number;
}): Promise<NewHourLog> => {
  // Verify project exists and is HOURLY type
  const project = await prisma.newLiveProject.findUniqueOrThrow({
    where: {
      id: data.projectId,
    },
  });

  if (project.projectType !== "HOURLY") {
    throw new Error("Hour logs can only be created for HOURLY projects");
  }

  const date = new Date(data.date);
  // Set time to start of day for consistent date comparison
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  // Check if hour log already exists for this project, user, and date
  const existingLog = await prisma.newHourLog.findFirst({
    where: {
      projectId: data.projectId,
      userId: data.userId,
      date: {
        gte: startOfDay,
        lte: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    },
  });

  if (existingLog) {
    // Update existing log
    return await prisma.newHourLog.update({
      where: {
        id: existingLog.id,
      },
      data: {
        submittedHours: new Decimal(data.submittedHours),
      },
      include: {
        user: {
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
    });
  }

  // Create new log
  return await prisma.newHourLog.create({
    data: {
      projectId: data.projectId,
      userId: data.userId,
      date: startOfDay,
      submittedHours: new Decimal(data.submittedHours),
    },
    include: {
      user: {
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
  });
};

/**
 * Get all hour logs for a project
 */
const getHourLogsFromDB = async (projectId: string) => {
  // Verify project exists
  await prisma.newLiveProject.findUniqueOrThrow({
    where: {
      id: projectId,
    },
  });

  return await prisma.newHourLog.findMany({
    where: {
      projectId,
    },
    orderBy: {
      date: "desc", // Latest first
    },
    include: {
      user: {
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
  });
};

export const NewLiveProjectService = {
  createNewLiveProjectIntoDB,
  getAllNewLiveProjectsFromDB,
  getSingleNewLiveProjectFromDB,
  updateNewLiveProjectIntoDB,
  deleteNewLiveProjectFromDB,
  uploadDocumentToProject,
  createProjectActionIntoDB,
  getProjectActionsFromDB,
  createHourLogIntoDB,
  getHourLogsFromDB,
};
