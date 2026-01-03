import { z } from "zod";

const dailyNoteSchema = z.object({
  note: z
    .string({ required_error: "Note is required", invalid_type_error: "Note must be a string" })
    .min(1, "Note cannot be empty"),
  createdAt: z
    .string({ invalid_type_error: "Created date must be a string" })
    .optional(),
});

const create = z.object({
  body: z.object({
    clientName: z
      .string({
        required_error: "Client name is required",
        invalid_type_error: "Client name must be a string",
      })
      .min(1, "Client name cannot be empty")
      .max(255, "Client name must be less than 255 characters"),
    clientLocation: z
      .string({ invalid_type_error: "Client location must be a string" })
      .max(500, "Client location must be less than 500 characters")
      .optional(),
    projectType: z.enum(["FIXED", "HOURLY"], {
      required_error: "Project type is required",
      invalid_type_error: "Project type must be either FIXED or HOURLY",
    }),
    projectBudget: z
      .number({
        required_error: "Project budget is required",
        invalid_type_error: "Project budget must be a number",
      })
      .positive("Project budget must be greater than 0")
      .max(999999999.99, "Project budget is too large"),
    paidAmount: z
      .number({
        invalid_type_error: "Paid amount must be a number",
      })
      .nonnegative("Paid amount cannot be negative")
      .max(999999999.99, "Paid amount is too large")
      .default(0),
    assignedMembers: z
      .array(
        z.string({
          required_error: "Assigned member ID is required",
          invalid_type_error: "Assigned member ID must be a string",
        }).min(1, "Assigned member ID cannot be empty"),
        {
          required_error: "Assigned members is required",
          invalid_type_error: "Assigned members must be an array",
        }
      )
      .min(1, "At least one assigned member is required")
      .max(50, "Cannot assign more than 50 members"),
    projectStatus: z
      .enum(["PENDING", "ACTIVE", "ON_HOLD", "COMPLETED"], {
        invalid_type_error: "Project status must be PENDING, ACTIVE, ON_HOLD, or COMPLETED",
      })
      .default("PENDING"),
    dailyNotes: z
      .array(dailyNoteSchema, {
        invalid_type_error: "Daily notes must be an array",
      })
      .optional(),
    nextActions: z
      .string({ invalid_type_error: "Next actions must be a string" })
      .max(1000, "Next actions must be less than 1000 characters")
      .optional(),
  }),
});

const update = z.object({
  body: z.object({
    clientName: z
      .string({ invalid_type_error: "Client name must be a string" })
      .min(1, "Client name cannot be empty")
      .max(255, "Client name must be less than 255 characters")
      .optional(),
    clientLocation: z
      .string({ invalid_type_error: "Client location must be a string" })
      .max(500, "Client location must be less than 500 characters")
      .optional(),
    projectType: z
      .enum(["FIXED", "HOURLY"], {
        invalid_type_error: "Project type must be either FIXED or HOURLY",
      })
      .optional(),
    projectBudget: z
      .number({ invalid_type_error: "Project budget must be a number" })
      .positive("Project budget must be greater than 0")
      .max(999999999.99, "Project budget is too large")
      .optional(),
    paidAmount: z
      .number({ invalid_type_error: "Paid amount must be a number" })
      .nonnegative("Paid amount cannot be negative")
      .max(999999999.99, "Paid amount is too large")
      .optional(),
    assignedMembers: z
      .array(
        z.string({
          invalid_type_error: "Assigned member ID must be a string",
        }).min(1, "Assigned member ID cannot be empty"),
        {
          invalid_type_error: "Assigned members must be an array",
        }
      )
      .min(1, "At least one assigned member is required")
      .max(50, "Cannot assign more than 50 members")
      .optional(),
    projectStatus: z
      .enum(["PENDING", "ACTIVE", "ON_HOLD", "COMPLETED"], {
        invalid_type_error: "Project status must be PENDING, ACTIVE, ON_HOLD, or COMPLETED",
      })
      .optional(),
    dailyNotes: z
      .array(dailyNoteSchema, {
        invalid_type_error: "Daily notes must be an array",
      })
      .optional(),
    nextActions: z
      .string({ invalid_type_error: "Next actions must be a string" })
      .max(1000, "Next actions must be less than 1000 characters")
      .optional(),
  }),
});

const addDailyNote = z.object({
  body: z.object({
    note: z
      .string({
        required_error: "Note is required",
        invalid_type_error: "Note must be a string",
      })
      .min(1, "Note cannot be empty")
      .max(5000, "Note must be less than 5000 characters"),
  }),
});

export const liveProjectValidationSchemas = {
  create,
  update,
  addDailyNote,
};

