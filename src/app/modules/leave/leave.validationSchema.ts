import { z } from "zod";

const createLeaveApplicationSchema = z.object({
  body: z
    .object({
      startDate: z.string().refine(
        (date) => {
          const parsedDate = new Date(date);
          return !isNaN(parsedDate.getTime()) && parsedDate > new Date();
        },
        {
          message: "Start date must be a valid future date",
        }
      ),
      endDate: z.string().refine(
        (date) => {
          const parsedDate = new Date(date);
          return !isNaN(parsedDate.getTime());
        },
        {
          message: "End date must be a valid date",
        }
      ),
      reason: z
        .string()
        .min(10, "Reason must be at least 10 characters")
        .max(500, "Reason cannot exceed 500 characters"),
    })
    .refine(
      (data) => {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return endDate >= startDate;
      },
      {
        message: "End date must be greater than or equal to start date",
        path: ["endDate"],
      }
    ),
});

const updateLeaveStatusSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
  }),
});

const leaveParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid leave application ID"),
  }),
});

export const leaveValidation = {
  createLeaveApplicationSchema,
  updateLeaveStatusSchema,
  leaveParamsSchema,
};
