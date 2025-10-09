import express, { NextFunction, Request, Response } from "express";
import authGuard from "../../middlewares/authGuard";
import permissionGuard from "../../middlewares/permissionGuard";
import { roleController } from "./role.controller";
import { roleValidationSchema } from "./role.validationSchema";

const router = express.Router();

// ⚠️ IMPORTANT: Specific routes MUST come before parameterized routes like /:id
// Otherwise Express will match them to /:id with the path segment as the id

// Get user roles (MUST come before /:id)
router.get(
  "/user/:userId/roles",
  authGuard(),
  permissionGuard("read_role"),
  roleController.getUserRoles
);

// Get user permissions (MUST come before /:id)
router.get(
  "/user/:userId/permissions",
  authGuard(),
  permissionGuard("read_permission"),
  roleController.getUserPermissions
);

// Assign role to user (MUST come before /:id)
router.post(
  "/assign-user",
  authGuard(),
  permissionGuard("assign_role"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.assignRoleToUserSchema.parse(req.body);
      return roleController.assignRoleToUser(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Remove role from user (MUST come before /:id)
router.post(
  "/remove-user",
  authGuard(),
  permissionGuard("assign_role"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.removeRoleFromUserSchema.parse(req.body);
      return roleController.removeRoleFromUser(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get all roles
router.get(
  "/",
  authGuard(),
  permissionGuard("read_role"),
  roleController.getAllRoles
);

// Get single role
router.get(
  "/:id",
  authGuard(),
  permissionGuard("read_role"),
  roleController.getSingleRole
);

// Create role
router.post(
  "/",
  authGuard(),
  permissionGuard("create_role"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.createRoleSchema.parse(req.body);
      return roleController.createRole(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Update role
router.put(
  "/:id",
  authGuard(),
  permissionGuard("update_role"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.updateRoleSchema.parse(req.body);
      return roleController.updateRole(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Delete role
router.delete(
  "/:id",
  authGuard(),
  permissionGuard("delete_role"),
  roleController.deleteRole
);

// Assign permissions to role
router.post(
  "/:id/permissions",
  authGuard(),
  permissionGuard("update_role"),
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
  authGuard(),
  permissionGuard("update_role"),
  roleController.removePermissionFromRole
);

export const roleRoutes = router;
