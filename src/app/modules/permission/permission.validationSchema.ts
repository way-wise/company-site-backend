import { z } from "zod";

const createPermissionSchema = z.object({
  name: z.string().min(1, "Permission name is required"),
  group: z.string().min(1, "Permission group is required"),
  description: z.string().optional(),
});

const updatePermissionSchema = z.object({
  name: z.string().min(1, "Permission name cannot be empty").optional(),
  group: z.string().min(1, "Permission group cannot be empty").optional(),
  description: z.string().optional(),
});

export const permissionValidationSchema = {
  createPermissionSchema,
  updatePermissionSchema,
};
