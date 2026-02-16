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
  hourlyRate?: number | null;
  progress?: number | null;
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
  let hourlyRate: Decimal | null = null;
  let progress: Decimal | null = null;

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

  // Handle hourly rate (optional for both project types)
  if (data.hourlyRate !== undefined && data.hourlyRate !== null) {
    hourlyRate = new Decimal(data.hourlyRate);
  }

  // Handle progress (optional, 0-100)
  if (data.progress !== undefined && data.progress !== null) {
    if (data.progress < 0 || data.progress > 100) {
      throw new Error("Progress must be between 0 and 100");
    }
    progress = new Decimal(data.progress);
  }

  // Parse committed deadline
  const committedDeadlineDate = data.committedDeadline
    ? new Date(data.committedDeadline)
    : null;

  // Parse targeted deadline - Prisma JSON fields need Prisma.JsonNull or undefined, not null
  let targetedDeadlineJson: Prisma.InputJsonValue | undefined = undefined;
  if (data.targetedDeadline) {
    targetedDeadlineJson = {
      backend: data.targetedDeadline.backend || null,
      frontend: data.targetedDeadline.frontend || null,
      ui: data.targetedDeadline.ui || null,
    } as Prisma.InputJsonValue;
  }

  // Initialize documents array - Prisma JSON fields need Prisma.JsonNull or undefined, not null
  let documentsJson: Prisma.InputJsonValue | undefined = undefined;
  if (data.documents && data.documents.length > 0) {
    documentsJson = data.documents as Prisma.InputJsonValue;
  }

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
      hourlyRate,
      paidHours: data.projectType === "HOURLY" ? new Decimal(0) : null,
      progress,
      committedDeadline: committedDeadlineDate,
      targetedDeadline: targetedDeadlineJson,
      documents: documentsJson,
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
    hourlyRate: number | null;
    paidHours: number | null;
    progress: number | null;
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

  // Calculate projectBudget, paidAmount, dueAmount, weeklyLimit, hourlyRate, paidHours, and progress based on project type
  let projectBudget: Decimal | null = null;
  let paidAmount: Decimal | null = null;
  let dueAmount: Decimal | null = null;
  let weeklyLimit: Decimal | null = null;
  let hourlyRate: Decimal | null = null;
  let paidHours: Decimal | null = null;
  let progress: Decimal | null = null;

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
    paidHours = null;
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
    
    // Handle paidHours for HOURLY projects
    if (data.paidHours !== undefined) {
      // Manual paidHours provided
      console.log("Updating paidHours from", existingProject.paidHours, "to", data.paidHours);
      paidHours = data.paidHours !== null ? new Decimal(data.paidHours) : null;
      console.log("New paidHours Decimal value:", paidHours?.toString());
    } else if (existingProject.projectType === "HOURLY") {
      // Keep existing paidHours
      paidHours = existingProject.paidHours;
    } else {
      // Switching from FIXED to HOURLY - initialize paidHours to 0
      paidHours = new Decimal(0);
    }
  }

  // Handle hourly rate (optional for both project types)
  if (data.hourlyRate !== undefined) {
    if (data.hourlyRate === null) {
      hourlyRate = null;
    } else {
      hourlyRate = new Decimal(data.hourlyRate);
    }
  } else {
    // Keep existing hourly rate if not provided
    hourlyRate = existingProject.hourlyRate;
  }

  // Handle progress (optional, 0-100)
  if (data.progress !== undefined) {
    if (data.progress === null) {
      progress = null;
    } else {
      if (data.progress < 0 || data.progress > 100) {
        throw new Error("Progress must be between 0 and 100");
      }
      progress = new Decimal(data.progress);
    }
  } else {
    // Keep existing progress if not provided
    progress = existingProject.progress;
  }

  // Parse committed deadline if provided
  const committedDeadlineDate =
    data.committedDeadline !== undefined
      ? data.committedDeadline
        ? new Date(data.committedDeadline)
        : null
      : existingProject.committedDeadline;

  // Parse targeted deadline if provided - Prisma JSON fields need Prisma.JsonNull or undefined, not null
  let targetedDeadlineJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined = undefined;
  if (data.targetedDeadline !== undefined) {
    if (data.targetedDeadline === null) {
      targetedDeadlineJson = Prisma.JsonNull;
    } else {
      targetedDeadlineJson = {
        backend: data.targetedDeadline.backend || null,
        frontend: data.targetedDeadline.frontend || null,
        ui: data.targetedDeadline.ui || null,
      } as Prisma.InputJsonValue;
    }
  }

  // Build updateData conditionally to avoid overwriting fields unnecessarily
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
    // Only update budget-related fields if explicitly provided or if project type is changing
    ...(data.projectBudget !== undefined && { projectBudget }),
    ...(data.paidAmount !== undefined && { paidAmount }),
    // dueAmount is calculated, so update when budget or paidAmount changes
    ...((data.projectBudget !== undefined || data.paidAmount !== undefined) && { dueAmount }),
    ...(data.weeklyLimit !== undefined && { weeklyLimit }),
    ...(data.hourlyRate !== undefined && { hourlyRate }),
    // IMPORTANT: Only update paidHours if explicitly provided
    ...(data.paidHours !== undefined && { paidHours }),
    ...(data.progress !== undefined && { progress }),
    ...(data.committedDeadline !== undefined && {
      committedDeadline: committedDeadlineDate,
    }),
    ...(data.targetedDeadline !== undefined && {
      targetedDeadline: targetedDeadlineJson,
    }),
  };

  console.log("Update data being sent to Prisma:", JSON.stringify({
    paidHours: paidHours?.toString(),
    updateDataPaidHours: updateData.paidHours,
    projectType,
    dataReceived: { paidHours: data.paidHours }
  }, null, 2));

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
 * Update a project action
 */
const updateProjectActionIntoDB = async (
  actionId: string,
  data: {
    actionText?: string;
    actionDate?: string;
  }
): Promise<NewProjectAction> => {
  const updateData: Prisma.NewProjectActionUpdateInput = {};

  if (data.actionText !== undefined) {
    updateData.actionText = data.actionText;
  }

  if (data.actionDate !== undefined) {
    updateData.actionDate = data.actionDate ? new Date(data.actionDate) : new Date();
  }

  return await prisma.newProjectAction.update({
    where: {
      id: actionId,
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
 * Delete a project action
 */
const deleteProjectActionFromDB = async (actionId: string): Promise<NewProjectAction> => {
  return await prisma.newProjectAction.delete({
    where: {
      id: actionId,
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

  let hourLog: NewHourLog;

  if (existingLog) {
    // Add to existing log hours (instead of replacing)
    const existingHours = typeof existingLog.submittedHours === "number" 
      ? existingLog.submittedHours 
      : Number(existingLog.submittedHours);
    const newTotalHours = existingHours + data.submittedHours;
    
    hourLog = await prisma.newHourLog.update({
      where: {
        id: existingLog.id,
      },
      data: {
        submittedHours: new Decimal(newTotalHours),
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
  } else {
    // Create new log
    hourLog = await prisma.newHourLog.create({
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
  }

  return hourLog;
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

/**
 * Update an hour log
 */
const updateHourLogIntoDB = async (
  hourLogId: string,
  data: {
    submittedHours: number;
  }
): Promise<NewHourLog> => {
  // Verify hour log exists
  const existingLog = await prisma.newHourLog.findUniqueOrThrow({
    where: {
      id: hourLogId,
    },
    include: {
      project: true,
    },
  });

  // Verify project is HOURLY type
  if (existingLog.project.projectType !== "HOURLY") {
    throw new Error("Hour logs can only be updated for HOURLY projects");
  }

  // Update the hour log
  const updatedLog = await prisma.newHourLog.update({
    where: {
      id: hourLogId,
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

  return updatedLog;
};

/**
 * Delete an hour log
 */
const deleteHourLogFromDB = async (hourLogId: string): Promise<NewHourLog> => {
  // Verify hour log exists
  const existingLog = await prisma.newHourLog.findUniqueOrThrow({
    where: {
      id: hourLogId,
    },
    include: {
      project: true,
    },
  });

  // Verify project is HOURLY type
  if (existingLog.project.projectType !== "HOURLY") {
    throw new Error("Hour logs can only be deleted for HOURLY projects");
  }

  // Delete the hour log
  const deletedLog = await prisma.newHourLog.delete({
    where: {
      id: hourLogId,
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

  return deletedLog;
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
  updateProjectActionIntoDB,
  deleteProjectActionFromDB,
  createHourLogIntoDB,
  getHourLogsFromDB,
  updateHourLogIntoDB,
  deleteHourLogFromDB,
};
