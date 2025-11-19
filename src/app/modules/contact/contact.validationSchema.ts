import { z } from "zod";

const submitContactForm = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters"),
    email: z.string().email("Invalid email address"),
    whatsappNumber: z
      .string()
      .min(10, "Phone number must be at least 10 characters")
      .max(20, "Phone number must not exceed 20 characters"),
    serviceRequired: z.string().min(1, "Service required is required"),
    projectBudget: z.string().min(1, "Project budget is required"),
    projectDescription: z
      .string()
      .min(10, "Project description must be at least 10 characters")
      .max(2000, "Project description must not exceed 2000 characters"),
  }),
});

export const contactValidationSchemas = {
  submitContactForm,
};

