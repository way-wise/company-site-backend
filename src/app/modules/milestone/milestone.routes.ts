import express from "express";
import roleGuard from "../../middlewares/roleGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { MilestoneController } from "./milestone.controller";
import { milestoneValidationSchemas } from "./milestone.validationSchema";

const router = express.Router();

router.post(
  "/",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(milestoneValidationSchemas.create),
  MilestoneController.createMilestone
);

router.get("/", MilestoneController.getAllMilestones);

router.get("/:id", MilestoneController.getSingleMilestone);

router.patch(
  "/:id",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(milestoneValidationSchemas.update),
  MilestoneController.updateMilestone
);

router.delete(
  "/:id",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  MilestoneController.deleteMilestone
);

router.post(
  "/:id/assign-employees",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(milestoneValidationSchemas.assignEmployee),
  MilestoneController.assignEmployees
);

router.post(
  "/:id/assign-services",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(milestoneValidationSchemas.assignService),
  MilestoneController.assignServices
);

export const MilestoneRoutes = router;



