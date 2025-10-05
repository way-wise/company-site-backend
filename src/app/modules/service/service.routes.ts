import { UserRole } from "@prisma/client";
import express from "express";
import authGuard from "../../middlewares/authGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ServiceController } from "./service.controller";
import { serviceValidationSchemas } from "./service.validationSchema";

const router = express.Router();

router.post(
  "/",
  // authGuard(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  // validateRequest(serviceValidationSchemas.create),
  ServiceController.createService
);

router.get("/", ServiceController.getAllService);

router.get("/:id", ServiceController.getSingleService);

router.patch(
  "/:id",
  authGuard(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(serviceValidationSchemas.update),
  ServiceController.updateService
);

router.delete(
  "/:id",
  authGuard(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ServiceController.deleteService
);

export const ServiceRoutes = router;
