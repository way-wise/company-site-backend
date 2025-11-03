import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import { adminValidationSchemas } from "./admin.ValidationSchema";

const router = express.Router();

router.get("/", permissionGuard("read_user"), AdminController.getAllAdmin);

router.get(
  "/:id",
  permissionGuard("read_user"),
  AdminController.getSingleAdmin
);

router.patch(
  "/:id",
  permissionGuard("update_user"),
  validateRequest(adminValidationSchemas.update),
  AdminController.updateAdmin
);

router.delete(
  "/:id",
  permissionGuard("delete_user"),
  AdminController.deleteAdmin
);

router.delete(
  "/soft/:id",
  permissionGuard("delete_user"),
  AdminController.softDeleteAdmin
);

export const AdminRoutes = router;
