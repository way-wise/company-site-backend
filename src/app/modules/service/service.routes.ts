import express from "express";
import roleGuard from "../../middlewares/roleGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ServiceController } from "./service.controller";
import { serviceValidationSchemas } from "./service.validationSchema";

const router = express.Router();

router.post(
  "/",
  // roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(serviceValidationSchemas.create),
  ServiceController.createService
);

router.get("/", ServiceController.getAllService);

router.get("/:id", ServiceController.getSingleService);

router.put(
  "/:id",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(serviceValidationSchemas.update),
  ServiceController.updateService
);

router.delete(
  "/:id",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  ServiceController.deleteService
);

export const ServiceRoutes = router;
