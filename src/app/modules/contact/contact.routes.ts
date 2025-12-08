import express from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { ContactController } from "./contact.controller";
import { ContactValidation } from "./contact.validationSchema";

const router = express.Router();

router.post(
	"/submit",
	validateRequest(ContactValidation.createContactSchema),
	ContactController.createContact
);

export const ContactRoutes = router;
