import { z } from "zod";

const createLeaveTypeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name cannot exceed 100 characters"),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    defaultDaysPerYear: z
      .number()
      .int("Days must be an integer")
      .min(0, "Days cannot be negative"),
    requiresDocument: z.boolean().default(false),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex code")
      .optional(),
    isActive: z.boolean().default(true).optional(),
  }),
});

const updateLeaveTypeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional()
      .nullable(),
    defaultDaysPerYear: z
      .number()
      .int("Days must be an integer")
      .min(0, "Days cannot be negative")
      .optional(),
    requiresDocument: z.boolean().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex code")
      .optional()
      .nullable(),
    isActive: z.boolean().optional(),
  }),
});

const leaveTypeParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Leave type ID is required"),
  }),
});

export const leaveTypeValidation = {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  leaveTypeParamsSchema,
};

