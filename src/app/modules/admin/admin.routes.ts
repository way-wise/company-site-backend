import express from "express";
import roleGuard from "../../middlewares/roleGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import { adminValidationSchemas } from "./admin.ValidationSchema";

const router = express.Router();

router.get("/", roleGuard("ADMIN", "SUPER_ADMIN"), AdminController.getAllAdmin);

router.get("/:id", AdminController.getSingleAdmin);

router.patch(
  "/:id",
  validateRequest(adminValidationSchemas.update),
  AdminController.updateAdmin
);

router.delete("/:id", AdminController.deleteAdmin);

router.delete("/soft/:id", AdminController.softDeleteAdmin);

export const AdminRoutes = router;
