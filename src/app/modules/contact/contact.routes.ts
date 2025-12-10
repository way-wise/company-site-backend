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

router.get("/", ContactController.getAllContacts);

export const ContactRoutes = router;
