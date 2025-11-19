import { z } from "zod";

// Helper to convert string boolean to boolean for FormData
const booleanFromString = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      return val === "true";
    }
    return val;
  },
  z.boolean()
);

const create = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    image: z.string().url("Image must be a valid URL").optional(),
    isShow: booleanFromString.optional().default(true),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    image: z.string().url("Image must be a valid URL").optional(),
    isShow: booleanFromString.optional(),
  }),
});

const toggleIsShow = z.object({
  body: z.object({
    isShow: booleanFromString,
  }),
});

export const partnerValidationSchemas = {
  create,
  update,
  toggleIsShow,
};

