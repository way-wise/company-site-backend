import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ServiceController } from "./service.controller";
import { serviceValidationSchemas } from "./service.validationSchema";

const router = express.Router();

router.post(
  "/",
  permissionGuard("create_service"),
  validateRequest(serviceValidationSchemas.create),
  ServiceController.createService
);

router.get(
  "/",
  permissionGuard("read_service"),
  ServiceController.getAllService
);

router.get(
  "/:id",
  permissionGuard("read_service"),
  ServiceController.getSingleService
);

router.put(
  "/:id",
  permissionGuard("update_service"),
  validateRequest(serviceValidationSchemas.update),
  ServiceController.updateService
);

router.delete(
  "/:id",
  permissionGuard("delete_service"),
  ServiceController.deleteService
);

export const ServiceRoutes = router;
