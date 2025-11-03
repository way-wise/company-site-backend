import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { MilestoneController } from "./milestone.controller";
import { milestoneValidationSchemas } from "./milestone.validationSchema";

const router = express.Router();

router.post(
  "/",
  permissionGuard("create_milestone"),
  validateRequest(milestoneValidationSchemas.create),
  MilestoneController.createMilestone
);

router.get(
  "/",
  permissionGuard("read_milestone"),
  MilestoneController.getAllMilestones
);

router.get(
  "/:id",
  permissionGuard("read_milestone"),
  MilestoneController.getSingleMilestone
);

router.patch(
  "/:id",
  permissionGuard("update_milestone"),
  validateRequest(milestoneValidationSchemas.update),
  MilestoneController.updateMilestone
);

router.delete(
  "/:id",
  permissionGuard("delete_milestone"),
  MilestoneController.deleteMilestone
);

router.post(
  "/:id/assign-employees",
  permissionGuard("manage_milestones"),
  validateRequest(milestoneValidationSchemas.assignEmployee),
  MilestoneController.assignEmployees
);

router.post(
  "/:id/assign-services",
  permissionGuard("manage_milestones"),
  validateRequest(milestoneValidationSchemas.assignService),
  MilestoneController.assignServices
);

export const MilestoneRoutes = router;
