import { z } from "zod";

const create = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  milestoneId: z.string().min(1, "Milestone ID is required"),
  creatorId: z.string().optional(),
  status: z
    .enum(["TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  estimatedHours: z.number().positive().optional(),
  spentHours: z.number().min(0).optional(),
});

const update = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z
      .enum(["TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE"])
      .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    progress: z.number().min(0).max(100).optional(),
    estimatedHours: z.number().positive().optional(),
    spentHours: z.number().min(0).optional(),
  }),
});

const assignEmployee = z.object({
  body: z.object({
    userProfileIds: z
      .array(z.string())
      .min(1, "At least one employee required"),
    roles: z.array(z.string()).optional(),
  }),
});

const addComment = z.object({
  body: z.object({
    content: z.string().min(1, "Comment content is required"),
  }),
});

const updateProgress = z.object({
  body: z.object({
    progress: z.number().min(0).max(100, "Progress must be between 0 and 100"),
  }),
});

const updateTimeTracking = z.object({
  body: z.object({
    spentHours: z.number().min(0, "Spent hours must be positive"),
  }),
});

export const taskValidationSchemas = {
  create,
  update,
  assignEmployee,
  addComment,
  updateProgress,
  updateTimeTracking,
};



