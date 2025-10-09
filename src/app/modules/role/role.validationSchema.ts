import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1, "Role name cannot be empty").optional(),
  description: z.string().optional(),
});

const assignPermissionsSchema = z.object({
  permissionIds: z
    .array(z.string())
    .min(1, "At least one permission is required"),
});

const assignRoleToUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

const removeRoleFromUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

export const roleValidationSchema = {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionsSchema,
  assignRoleToUserSchema,
  removeRoleFromUserSchema,
};
