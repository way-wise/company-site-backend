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
    email: z.string({ message: "Email is required" }),
    contactNumber: z.string({ message: "Contact number is required" }),
    gender: z.string({ message: "Gender is required" }),
  }),
});

export const userValidationSchema = {
  createAdminSchema,
  createClientSchema,
};
