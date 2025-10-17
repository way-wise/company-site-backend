import { z } from "zod";

const create = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const serviceValidationSchemas = {
  create,
  update,
};
