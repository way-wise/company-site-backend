import express, { NextFunction, Request, Response } from "express";
import { permissionController } from "./permission.controller";
import { permissionValidationSchema } from "./permission.validationSchema";

const router = express.Router();

// Get all permissions
router.get("/", permissionController.getAllPermissions);

// Get permission groups
router.get("/groups", permissionController.getPermissionGroups);

// Get single permission
router.get("/:id", permissionController.getSinglePermission);

// Create permission
router.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = permissionValidationSchema.createPermissionSchema.parse(
      req.body
    );
    return permissionController.createPermission(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Update permission
router.put("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = permissionValidationSchema.updatePermissionSchema.parse(
      req.body
    );
    return permissionController.updatePermission(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Delete permission
router.delete("/:id", permissionController.deletePermission);

export const permissionRoutes = router;
