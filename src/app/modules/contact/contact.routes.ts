import express from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { ContactController } from "./contact.controller";
import { contactValidationSchemas } from "./contact.validationSchema";

const router = express.Router();

router.post(
  "/submit",
  validateRequest(contactValidationSchemas.submitContactForm),
  ContactController.submitContactForm
);

export const ContactRoutes = router;

