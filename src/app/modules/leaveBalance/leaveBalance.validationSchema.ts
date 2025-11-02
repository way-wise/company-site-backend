import { z } from "zod";

const createLeaveBalanceSchema = z.object({
  body: z.object({
    userProfileId: z.string().min(1, "User profile ID is required"),
    leaveTypeId: z.string().min(1, "Leave type ID is required"),
    year: z
      .number()
      .int("Year must be an integer")
      .min(2000, "Year must be after 2000")
      .max(2100, "Year must be before 2100"),
    totalDays: z
      .number()
      .int("Days must be an integer")
      .min(0, "Days cannot be negative"),
  }),
});

const updateLeaveBalanceSchema = z.object({
  body: z.object({
    totalDays: z
      .number()
      .int("Days must be an integer")
      .min(0, "Days cannot be negative")
      .optional(),
    usedDays: z
      .number()
      .int("Days must be an integer")
      .min(0, "Days cannot be negative")
      .optional(),
  }),
});

const leaveBalanceParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Leave balance ID is required"),
  }),
});

const allocateBalanceSchema = z.object({
  body: z.object({
    year: z
      .number()
      .int("Year must be an integer")
      .min(2000, "Year must be after 2000")
      .max(2100, "Year must be before 2100")
      .optional(),
  }),
});

export const leaveBalanceValidation = {
  createLeaveBalanceSchema,
  updateLeaveBalanceSchema,
  leaveBalanceParamsSchema,
  allocateBalanceSchema,
};

