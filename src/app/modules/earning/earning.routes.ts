import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { EarningController } from "./earning.controller";
import { earningValidationSchemas } from "./earning.validationSchema";

const router = express.Router();

router.post(
  "/",
  permissionGuard("create_earning"),
  validateRequest(earningValidationSchemas.create),
  EarningController.createEarning
);

router.get(
  "/",
  permissionGuard("read_earning"),
  EarningController.getAllEarnings
);

router.get(
  "/stats",
  permissionGuard("read_earning"),
  EarningController.getEarningStats
);

router.get(
  "/project-earnings",
  permissionGuard("read_earning"),
  EarningController.getProjectEarnings
);

router.get(
  "/:id",
  permissionGuard("read_earning"),
  EarningController.getSingleEarning
);

router.patch(
  "/:id",
  permissionGuard("update_earning"),
  validateRequest(earningValidationSchemas.update),
  EarningController.updateEarning
);

router.delete(
  "/:id",
  permissionGuard("delete_earning"),
  EarningController.deleteEarning
);

export const EarningRoutes = router;

