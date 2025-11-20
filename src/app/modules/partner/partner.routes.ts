import express from "express";
import { fileUploader } from "../../../helpers/fileUploader";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { PartnerController } from "./partner.controller";
import { partnerValidationSchemas } from "./partner.validationSchema";

const router = express.Router();

// Public route - no authentication required
router.get("/public", PartnerController.getPublicPartners);

// Protected routes
router.post(
  "/",
  permissionGuard("create_partner"),
  fileUploader.upload.single("image"),
  validateRequest(partnerValidationSchemas.create),
  PartnerController.createPartner
);

router.get(
  "/",
  permissionGuard("read_partner"),
  PartnerController.getAllPartner
);

router.get(
  "/:id",
  permissionGuard("read_partner"),
  PartnerController.getSinglePartner
);

router.put(
  "/:id",
  permissionGuard("update_partner"),
  fileUploader.upload.single("image"),
  validateRequest(partnerValidationSchemas.update),
  PartnerController.updatePartner
);

router.patch(
  "/:id/toggle-visibility",
  permissionGuard("toggle_partner_visibility"),
  validateRequest(partnerValidationSchemas.toggleIsShow),
  PartnerController.togglePartnerIsShow
);

router.delete(
  "/:id",
  permissionGuard("delete_partner"),
  PartnerController.deletePartner
);

export const PartnerRoutes = router;

