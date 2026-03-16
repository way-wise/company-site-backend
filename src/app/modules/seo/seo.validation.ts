import { z } from "zod";

const createSeoZodSchema = z.object({
  body: z.object({
    pageSlug: z.string({
      message: "Page slug is required",
    }),
    pageName: z.string({
      message: "Page name is required",
    }),
    metaTitle: z.string({
      message: "Meta title is required",
    }),
    metaDescription: z.string({
      message: "Meta description is required",
    }),
    keywords: z.array(z.string()).optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
    twitterTitle: z.string().optional(),
    twitterDescription: z.string().optional(),
    twitterImage: z.string().optional(),
    canonicalUrl: z.string().optional(),
    robotsIndex: z.boolean().optional(),
    robotsFollow: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateSeoZodSchema = z.object({
  body: z.object({
    pageName: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
    twitterTitle: z.string().optional(),
    twitterDescription: z.string().optional(),
    twitterImage: z.string().optional(),
    canonicalUrl: z.string().optional(),
    robotsIndex: z.boolean().optional(),
    robotsFollow: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const SeoValidation = {
  createSeoZodSchema,
  updateSeoZodSchema,
};
