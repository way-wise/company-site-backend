import express, { NextFunction, Request, Response } from "express";
import { roleController } from "./role.controller";
import { roleValidationSchema } from "./role.validationSchema";

const router = express.Router();

// Get all roles
router.get("/", roleController.getAllRoles);

// Get single role
router.get("/:id", roleController.getSingleRole);

// Get user roles
router.get("/user/:userId/roles", roleController.getUserRoles);

// Get user permissions (all permissions from all assigned roles)
router.get("/user/:userId/permissions", roleController.getUserPermissions);

// Create role
router.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = roleValidationSchema.createRoleSchema.parse(req.body);
    return roleController.createRole(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Update role
router.put("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = roleValidationSchema.updateRoleSchema.parse(req.body);
    return roleController.updateRole(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Delete role
router.delete("/:id", roleController.deleteRole);

// Assign permissions to role
router.post(
  "/:id/permissions",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.assignPermissionsSchema.parse(req.body);
      return roleController.assignPermissionsToRole(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Remove permission from role
router.delete(
  "/:roleId/permissions/:permissionId",
  roleController.removePermissionFromRole
);

// Assign role to user
router.post(
  "/assign-user",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.assignRoleToUserSchema.parse(req.body);
      return roleController.assignRoleToUser(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Remove role from user
router.post(
  "/remove-user",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.removeRoleFromUserSchema.parse(req.body);
      return roleController.removeRoleFromUser(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export const roleRoutes = router;
