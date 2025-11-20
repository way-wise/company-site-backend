import { z } from "zod";

const upload = z.object({
  body: z.object({
    projectId: z.string().min(1, "Project ID is required"),
  }),
});

export const projectFileValidationSchemas = {
  upload,
};

