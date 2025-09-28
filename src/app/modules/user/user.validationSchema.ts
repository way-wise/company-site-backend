import { z } from "zod";

const createAdminSchema = z.object({
  password: z.string({ message: "Password is required" }),
  admin: z.object({
    name: z.string({ message: "Name is required" }),
    email: z.string({ message: "Email is required" }),
    contactNumber: z.string({ message: "Contact number is required" }),
  }),
});
const createClientSchema = z.object({
  password: z.string({ message: "Password is required" }),
  client: z.object({
    name: z.string({ message: "Name is required" }),
    email: z.string().email({ message: "Valid email is required" }),
    contactNumber: z.string({ message: "Contact number is required" }),
    gender: z.enum(["MALE", "FEMALE"], {
      message: "Gender must be MALE or FEMALE",
    }),
    address: z.string().optional(),
    bio: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    twitter: z.string().optional(),
    linkedIn: z.string().optional(),
    facebook: z.string().optional(),
    language: z.string().optional(),
    education: z.string().optional(),
    experience: z.string().optional(),
  }),
});

export const userValidationSchema = {
  createAdminSchema,
  createClientSchema,
};
