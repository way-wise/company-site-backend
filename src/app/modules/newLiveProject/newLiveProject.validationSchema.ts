import { z } from "zod";

/**
 * Document validation schema
 */
const documentSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("File URL must be a valid URL"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().positive("File size must be positive"),
  uploadedBy: z.string().min(1, "Uploaded by is required"),
  uploadedAt: z.string().datetime("Uploaded at must be a valid ISO datetime"),
});

/**
 * Targeted deadline validation schema
 */
const targetedDeadlineSchema = z.object({
  backend: z.string().datetime().nullable().optional(),
  frontend: z.string().datetime().nullable().optional(),
  ui: z.string().datetime().nullable().optional(),
});

/**
 * Create new live project validation schema
 */
const create = z
  .object({
    body: z.object({
      projectName: z
        .string({ message: "Project name must be a string" })
        .min(1, "Project name is required and cannot be empty")
        .max(255, "Project name must be less than 255 characters"),
      clientName: z
        .string({ message: "Client name must be a string" })
        .max(255, "Client name must be less than 255 characters")
        .optional(),
      clientLocation: z
        .string({ message: "Client location must be a string" })
        .max(500, "Client location must be less than 500 characters")
        .optional(),
      assignedMembers: z
        .array(z.string(), { message: "Assigned members must be an array of strings" })
        .min(1, "At least one assigned member is required"),
      projectStatus: z
        .enum(["PENDING", "ACTIVE", "COMPLETED", "CANCEL", "ARCHIVED"], {
          message: "Project status must be PENDING, ACTIVE, COMPLETED, CANCEL, or ARCHIVED",
        })
        .default("PENDING"),
      projectType: z.enum(["FIXED", "HOURLY"], {
        message: "Project type is required and must be either FIXED or HOURLY",
      }),
      projectBudget: z
        .number({ message: "Project budget must be a number" })
        .positive("Project budget must be greater than 0")
        .max(999999999.99, "Project budget is too large")
        .optional()
        .nullable(),
      paidAmount: z
        .number({ message: "Paid amount must be a number" })
        .nonnegative("Paid amount cannot be negative")
        .max(999999999.99, "Paid amount is too large")
        .optional()
        .nullable(),
      weeklyLimit: z
        .number({ message: "Weekly limit must be a number" })
        .positive("Weekly limit must be greater than 0")
        .max(168, "Weekly limit cannot exceed 168 hours (1 week)")
        .optional()
        .nullable(),
      hourlyRate: z
        .number({ message: "Hourly rate must be a number" })
        .positive("Hourly rate must be greater than 0")
        .max(999999.99, "Hourly rate is too large")
        .optional()
        .nullable(),
      paidHours: z
        .number({ message: "Paid hours must be a number" })
        .nonnegative("Paid hours cannot be negative")
        .optional()
        .nullable(),
      progress: z
        .number({ message: "Progress must be a number" })
        .min(0, "Progress cannot be negative")
        .max(100, "Progress cannot exceed 100")
        .optional()
        .nullable(),
      committedDeadline: z
        .string({ message: "Committed deadline must be a valid date string" })
        .datetime({ message: "Committed deadline must be a valid ISO datetime string" })
        .optional()
        .nullable(),
      targetedDeadline: targetedDeadlineSchema.optional().nullable(),
      documents: z
        .array(documentSchema, { message: "Documents must be an array" })
        .optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.body.projectType === "FIXED") {
        return (
          data.body.projectBudget !== undefined &&
          data.body.projectBudget !== null
        );
      }
      return true;
    },
    {
      message: "Project budget is required for FIXED projects",
      path: ["body", "projectBudget"],
    }
  )
  .refine(
    (data) => {
      if (data.body.projectType === "FIXED") {
        return (
          data.body.paidAmount !== undefined && data.body.paidAmount !== null
        );
      }
      return true;
    },
    {
      message: "Paid amount is required for FIXED projects",
      path: ["body", "paidAmount"],
    }
  )
  .refine(
    (data) => {
      if (data.body.projectType === "HOURLY") {
        return (
          data.body.weeklyLimit !== undefined && data.body.weeklyLimit !== null
        );
      }
      return true;
    },
    {
      message: "Weekly limit is required for HOURLY projects",
      path: ["body", "weeklyLimit"],
    }
  )
  .refine(
    (data) => {
      if (data.body.projectType === "HOURLY") {
        return (
          data.body.projectBudget === undefined || data.body.projectBudget === null
        );
      }
      return true;
    },
    {
      message: "Project budget should not be provided for HOURLY projects",
      path: ["body", "projectBudget"],
    }
  )
  .refine(
    (data) => {
      if (data.body.projectType === "HOURLY") {
        return (
          data.body.paidAmount === undefined || data.body.paidAmount === null
        );
      }
      return true;
    },
    {
      message: "Paid amount should not be provided for HOURLY projects",
      path: ["body", "paidAmount"],
    }
  )
  .refine(
    (data) => {
      if (data.body.projectType === "FIXED") {
        return (
          data.body.weeklyLimit === undefined || data.body.weeklyLimit === null
        );
      }
      return true;
    },
    {
      message: "Weekly limit should not be provided for FIXED projects",
      path: ["body", "weeklyLimit"],
    }
  );

/**
 * Update new live project validation schema
 */
const update = z
  .object({
    body: z.object({
      projectName: z
        .string({ message: "Project name must be a string" })
        .min(1, "Project name cannot be empty")
        .max(255, "Project name must be less than 255 characters")
        .optional(),
      clientName: z
        .string({ message: "Client name must be a string" })
        .max(255, "Client name must be less than 255 characters")
        .optional(),
      clientLocation: z
        .string({ message: "Client location must be a string" })
        .max(500, "Client location must be less than 500 characters")
        .optional(),
      assignedMembers: z
        .array(z.string(), { message: "Assigned members must be an array of strings" })
        .optional(),
      projectStatus: z
        .enum(["PENDING", "ACTIVE", "COMPLETED", "CANCEL", "ARCHIVED"], {
          message: "Project status must be PENDING, ACTIVE, COMPLETED, CANCEL, or ARCHIVED",
        })
        .optional(),
      projectType: z
        .enum(["FIXED", "HOURLY"], {
          message: "Project type must be either FIXED or HOURLY",
        })
        .optional(),
      projectBudget: z
        .number({ message: "Project budget must be a number" })
        .positive("Project budget must be greater than 0")
        .max(999999999.99, "Project budget is too large")
        .optional()
        .nullable(),
      paidAmount: z
        .number({ message: "Paid amount must be a number" })
        .nonnegative("Paid amount cannot be negative")
        .max(999999999.99, "Paid amount is too large")
        .optional()
        .nullable(),
      weeklyLimit: z
        .number({ message: "Weekly limit must be a number" })
        .positive("Weekly limit must be greater than 0")
        .max(168, "Weekly limit cannot exceed 168 hours (1 week)")
        .optional()
        .nullable(),
      hourlyRate: z
        .number({ message: "Hourly rate must be a number" })
        .positive("Hourly rate must be greater than 0")
        .max(999999.99, "Hourly rate is too large")
        .optional()
        .nullable(),
      paidHours: z
        .number({ message: "Paid hours must be a number" })
        .nonnegative("Paid hours cannot be negative")
        .optional()
        .nullable(),
      progress: z
        .number({ message: "Progress must be a number" })
        .min(0, "Progress cannot be negative")
        .max(100, "Progress cannot exceed 100")
        .optional()
        .nullable(),
      committedDeadline: z
        .string({ message: "Committed deadline must be a valid date string" })
        .datetime({ message: "Committed deadline must be a valid ISO datetime string" })
        .optional()
        .nullable(),
      targetedDeadline: targetedDeadlineSchema.optional().nullable(),
    }),
  })
  .refine(
    (data) => {
      const projectType = data.body.projectType;
      const projectBudget = data.body.projectBudget;
      
      if (projectType === "FIXED") {
        return projectBudget !== undefined && projectBudget !== null;
      }
      if (projectType === "HOURLY") {
        return projectBudget === undefined || projectBudget === null;
      }
      return true;
    },
    {
      message: "Project budget is required for FIXED projects and should not be provided for HOURLY projects",
      path: ["body", "projectBudget"],
    }
  )
  .refine(
    (data) => {
      const projectType = data.body.projectType;
      const paidAmount = data.body.paidAmount;
      
      if (projectType === "FIXED") {
        return paidAmount !== undefined && paidAmount !== null;
      }
      if (projectType === "HOURLY") {
        return paidAmount === undefined || paidAmount === null;
      }
      return true;
    },
    {
      message: "Paid amount is required for FIXED projects and should not be provided for HOURLY projects",
      path: ["body", "paidAmount"],
    }
  )
  .refine(
    (data) => {
      const projectType = data.body.projectType;
      const weeklyLimit = data.body.weeklyLimit;
      
      if (projectType === "HOURLY") {
        return weeklyLimit !== undefined && weeklyLimit !== null;
      }
      if (projectType === "FIXED") {
        return weeklyLimit === undefined || weeklyLimit === null;
      }
      return true;
    },
    {
      message: "Weekly limit is required for HOURLY projects and should not be provided for FIXED projects",
      path: ["body", "weeklyLimit"],
    }
  );

/**
 * Create project action validation schema
 */
const createAction = z.object({
  body: z.object({
    actionText: z
      .string({ message: "Action text must be a string" })
      .min(1, "Action text is required and cannot be empty")
      .max(2000, "Action text must be less than 2000 characters"),
    actionDate: z
      .string({ message: "Action date must be a valid date string" })
      .datetime({ message: "Action date must be a valid ISO datetime string" })
      .optional(),
  }),
});

/**
 * Update project action validation schema
 */
const updateAction = z
  .object({
    body: z.object({
      actionText: z
        .string({ message: "Action text must be a string" })
        .min(1, "Action text cannot be empty")
        .max(2000, "Action text must be less than 2000 characters")
        .optional(),
      actionDate: z
        .string({ message: "Action date must be a valid date string" })
        .datetime({ message: "Action date must be a valid ISO datetime string" })
        .optional(),
    }),
  })
  .refine(
    (data) => {
      return (
        data.body.actionText !== undefined || data.body.actionDate !== undefined
      );
    },
    {
      message: "At least one field (actionText or actionDate) must be provided",
      path: ["body"],
    }
  );

/**
 * Create hour log validation schema
 */
const createHourLog = z.object({
  body: z.object({
    date: z
      .string({ message: "Date must be a valid date string" })
      .datetime({ message: "Date must be a valid ISO datetime string" }),
    submittedHours: z
      .number({ message: "Submitted hours must be a number" })
      .positive("Submitted hours must be greater than 0")
      .max(24, "Submitted hours cannot exceed 24 hours per day"),
  }),
});

/**
 * Update hour log validation schema
 */
const updateHourLog = z.object({
  body: z.object({
    submittedHours: z
      .number({ message: "Submitted hours must be a number" })
      .positive("Submitted hours must be greater than 0")
      .max(24, "Submitted hours cannot exceed 24 hours per day"),
  }),
});

export const newLiveProjectValidationSchemas = {
  create,
  update,
  createAction,
  updateAction,
  createHourLog,
  updateHourLog,
};
