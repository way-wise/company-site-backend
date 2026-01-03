import { z } from "zod";

const dailyNoteSchema = z.object({
  note: z
    .string({ message: "Note must be a string" })
    .min(1, "Note is required and cannot be empty"),
  createdAt: z
    .string({ message: "Created date must be a string" })
    .optional(),
});

const create = z
  .object({
    body: z.object({
      clientName: z
        .string({ message: "Client name must be a string" })
        .min(1, "Client name is required and cannot be empty")
        .max(255, "Client name must be less than 255 characters"),
      clientLocation: z
        .string({ message: "Client location must be a string" })
        .max(500, "Client location must be less than 500 characters")
        .optional(),
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
      assignedMembers: z
        .array(
          z.string({ message: "Assigned member ID must be a string" })
            .min(1, "Assigned member ID cannot be empty")
        )
        .min(1, "At least one assigned member is required")
        .max(50, "Cannot assign more than 50 members"),
      projectStatus: z
        .enum(["PENDING", "ACTIVE", "ON_HOLD", "COMPLETED"], {
          message: "Project status must be PENDING, ACTIVE, ON_HOLD, or COMPLETED",
        })
        .default("PENDING"),
      dailyNotes: z
        .array(dailyNoteSchema, { message: "Daily notes must be an array" })
        .optional(),
      nextActions: z
        .string({ message: "Next actions must be a string" })
        .max(1000, "Next actions must be less than 1000 characters")
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
  );

const update = z
  .object({
    body: z.object({
      clientName: z
        .string({ message: "Client name must be a string" })
        .min(1, "Client name cannot be empty")
        .max(255, "Client name must be less than 255 characters")
        .optional(),
      clientLocation: z
        .string({ message: "Client location must be a string" })
        .max(500, "Client location must be less than 500 characters")
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
      assignedMembers: z
        .array(
          z.string({ message: "Assigned member ID must be a string" })
            .min(1, "Assigned member ID cannot be empty")
        )
        .min(1, "At least one assigned member is required")
        .max(50, "Cannot assign more than 50 members")
        .optional(),
      projectStatus: z
        .enum(["PENDING", "ACTIVE", "ON_HOLD", "COMPLETED"], {
          message: "Project status must be PENDING, ACTIVE, ON_HOLD, or COMPLETED",
        })
        .optional(),
      dailyNotes: z
        .array(dailyNoteSchema, { message: "Daily notes must be an array" })
        .optional(),
      nextActions: z
        .string({ message: "Next actions must be a string" })
        .max(1000, "Next actions must be less than 1000 characters")
        .optional(),
    }),
  })
  .refine(
    (data) => {
      const projectType = data.body.projectType;
      const projectBudget = data.body.projectBudget;
      
      // Only validate if projectType is explicitly provided
      if (projectType === "FIXED") {
        // For FIXED projects, budget must be provided and not null
        return projectBudget !== undefined && projectBudget !== null;
      }
      if (projectType === "HOURLY") {
        // For HOURLY projects, budget should not be provided
        return projectBudget === undefined || projectBudget === null;
      }
      // If projectType is not provided, allow any budget value (service will handle validation)
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
      
      // Only validate if projectType is explicitly provided
      if (projectType === "FIXED") {
        // For FIXED projects, paidAmount must be provided and not null
        return paidAmount !== undefined && paidAmount !== null;
      }
      if (projectType === "HOURLY") {
        // For HOURLY projects, paidAmount should not be provided
        return paidAmount === undefined || paidAmount === null;
      }
      // If projectType is not provided, allow any paidAmount value (service will handle validation)
      return true;
    },
    {
      message: "Paid amount is required for FIXED projects and should not be provided for HOURLY projects",
      path: ["body", "paidAmount"],
    }
  );

const addDailyNote = z.object({
  body: z.object({
    note: z
      .string({ message: "Note must be a string" })
      .min(1, "Note is required and cannot be empty")
      .max(5000, "Note must be less than 5000 characters"),
  }),
});

export const liveProjectValidationSchemas = {
  create,
  update,
  addDailyNote,
};

