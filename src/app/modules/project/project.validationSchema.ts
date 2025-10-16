import { z } from "zod";

const create = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  userProfileId: z.string().min(1, "User profile ID is required"),
});

const update = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  }),
});

export const projectValidationSchemas = {
  create,
  update,
};



