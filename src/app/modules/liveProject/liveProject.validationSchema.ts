import { z } from "zod";

const dailyNoteSchema = z.object({
  note: z.string().min(1, "Note is required"),
  createdAt: z.string().optional(),
});

const create = z.object({
  body: z.object({
    clientName: z.string().min(1, "Client name is required"),
    clientLocation: z.string().optional(),
    projectType: z.enum(["FIXED", "HOURLY"], {
      required_error: "Project type is required",
      invalid_type_error: "Project type must be either FIXED or HOURLY",
    }),
    projectBudget: z
      .number({
        required_error: "Project budget is required",
        invalid_type_error: "Project budget must be a number",
      })
      .positive("Project budget must be a positive number"),
    paidAmount: z
      .number()
      .nonnegative("Paid amount must be a non-negative number")
      .default(0),
    assignedMembers: z
      .array(z.string().min(1, "Assigned member ID is required"))
      .min(1, "At least one assigned member is required"),
    projectStatus: z
      .enum(["PENDING", "ACTIVE", "ON_HOLD", "COMPLETED"])
      .default("PENDING"),
    dailyNotes: z.array(dailyNoteSchema).optional(),
    nextActions: z.string().optional(),
  }),
});

const update = z.object({
  body: z.object({
    clientName: z.string().min(1, "Client name is required").optional(),
    clientLocation: z.string().optional(),
    projectType: z
      .enum(["FIXED", "HOURLY"], {
        invalid_type_error: "Project type must be either FIXED or HOURLY",
      })
      .optional(),
    projectBudget: z
      .number()
      .positive("Project budget must be a positive number")
      .optional(),
    paidAmount: z
      .number()
      .nonnegative("Paid amount must be a non-negative number")
      .optional(),
    assignedMembers: z
      .array(z.string().min(1, "Assigned member ID is required"))
      .optional(),
    projectStatus: z
      .enum(["PENDING", "ACTIVE", "ON_HOLD", "COMPLETED"])
      .optional(),
    dailyNotes: z.array(dailyNoteSchema).optional(),
    nextActions: z.string().optional(),
  }),
});

const addDailyNote = z.object({
  body: z.object({
    note: z.string().min(1, "Note is required"),
  }),
});

export const liveProjectValidationSchemas = {
  create,
  update,
  addDailyNote,
};

