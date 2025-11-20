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
    category: z.string().optional(),
    receiptUrl: z.string().url().optional().or(z.literal("")),
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
    category: z.string().optional(),
    receiptUrl: z.string().url().optional().or(z.literal("")).nullable(),
  }),
});

export const expenseValidationSchemas = {
  create,
  update,
};

