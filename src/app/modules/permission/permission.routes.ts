import express, { NextFunction, Request, Response } from "express";
import authGuard from "../../middlewares/authGuard";
import permissionGuard from "../../middlewares/permissionGuard";
import { permissionController } from "./permission.controller";
import { permissionValidationSchema } from "./permission.validationSchema";

const router = express.Router();

// Get permission groups (MUST come before /:id route)
router.get(
  "/groups",
  authGuard(),
  permissionGuard("read_permission"),
  permissionController.getPermissionGroups
);

// Get all permissions
router.get(
  "/",
  authGuard(),
  permissionGuard("read_permission"),
  permissionController.getAllPermissions
);

// Get single permission
router.get(
  "/:id",
  authGuard(),
  permissionGuard("read_permission"),
  permissionController.getSinglePermission
);

// Create permission
router.post(
  "/",
  authGuard(),
  permissionGuard("create_permission"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = permissionValidationSchema.createPermissionSchema.parse(
        req.body
      );
      return permissionController.createPermission(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Update permission
router.put(
  "/:id",
  authGuard(),
  permissionGuard("update_permission"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = permissionValidationSchema.updatePermissionSchema.parse(
        req.body
      );
      return permissionController.updatePermission(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Delete permission
router.delete(
  "/:id",
  authGuard(),
  permissionGuard("delete_permission"),
  permissionController.deletePermission
);

export const permissionRoutes = router;
