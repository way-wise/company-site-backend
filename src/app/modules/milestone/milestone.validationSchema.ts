import { z } from "zod";

const create = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    cost: z.number().positive("Cost must be a positive number"),
    status: z
      .enum([
        "PENDING",
        "ONGOING",
        "COMPLETED",
        "REVIEW",
        "APPROVED",
        "REJECTED",
      ])
      .optional(),
    projectId: z.string().min(1, "Project ID is required"),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    cost: z.number().positive("Cost must be a positive number").optional(),
    status: z
      .enum([
        "PENDING",
        "ONGOING",
        "COMPLETED",
        "REVIEW",
        "APPROVED",
        "REJECTED",
      ])
      .optional(),
    paymentStatus: z.enum(["UNPAID", "PAID"]).optional(),
  }),
});

const assignEmployee = z.object({
  body: z.object({
    userProfileIds: z
      .array(z.string())
      .min(1, "At least one employee required"),
  }),
});

const assignService = z.object({
  body: z.object({
    serviceIds: z.array(z.string()).min(1, "At least one service required"),
  }),
});

export const milestoneValidationSchemas = {
  create,
  update,
  assignEmployee,
  assignService,
};
