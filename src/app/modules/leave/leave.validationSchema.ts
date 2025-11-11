import { LeaveType } from "@prisma/client";
import { z } from "zod";

const createLeaveApplicationSchema = z.object({
  body: z
    .object({
      leaveType: z.nativeEnum(LeaveType).optional(),
      startDate: z.string().refine(
        (date) => {
          const parsedDate = new Date(date);
          return !isNaN(parsedDate.getTime());
        },
        {
          message: "Start date must be a valid date",
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
      attachmentUrl: z.string().url("Invalid attachment URL").optional(),
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
    rejectionReason: z.string().optional(),
    comments: z.string().optional(),
  }),
});

const leaveParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Leave application ID is required"),
  }),
});

const leaveCalendarQuerySchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    userProfileId: z.string().optional(),
    leaveType: z
      .union([z.nativeEnum(LeaveType), z.array(z.nativeEnum(LeaveType))])
      .optional(),
  }),
});

export const leaveValidation = {
  createLeaveApplicationSchema,
  updateLeaveStatusSchema,
  leaveParamsSchema,
  leaveCalendarQuerySchema,
};
