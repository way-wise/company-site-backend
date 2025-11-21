import { z } from "zod";

const create = z
  .object({
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
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.body.startDate && data.body.endDate) {
        return data.body.endDate >= data.body.startDate;
      }
      return true;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["body", "endDate"],
    }
  );

const update = z
  .object({
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
      startDate: z.coerce.date().optional().nullable(),
      endDate: z.coerce.date().optional().nullable(),
    }),
  })
  .refine(
    (data) => {
      if (data.body.startDate && data.body.endDate) {
        return data.body.endDate >= data.body.startDate;
      }
      return true;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["body", "endDate"],
    }
  );

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
