import { z } from "zod";

const create = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be positive"),
    description: z.string().optional(),
    date: z.union([z.string(), z.date()]).transform((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    }),
    projectId: z.string().optional(),
    category: z.string().optional(),
  }),
});

const update = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be positive").optional(),
    description: z.string().optional(),
    date: z
      .union([z.string(), z.date()])
      .transform((val) => {
        if (typeof val === "string") {
          return new Date(val);
        }
        return val;
      })
      .optional(),
    projectId: z.string().optional().nullable(),
    category: z.string().optional(),
  }),
});

export const earningValidationSchemas = {
  create,
  update,
};

