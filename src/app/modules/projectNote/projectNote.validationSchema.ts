import { z } from "zod";

const createOrUpdate = z.object({
  body: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    content: z.string().optional().default(""),
  }),
});

const update = z.object({
  body: z.object({
    content: z.string().min(1, "Content is required"),
  }),
});

export const projectNoteValidationSchemas = {
  createOrUpdate,
  update,
};

