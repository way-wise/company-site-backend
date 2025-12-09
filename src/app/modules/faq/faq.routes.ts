import express from "express";

import { FaqController } from "./faq.controller";
import { FaqValidation } from "./faq.validation";

import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";

const router = express.Router();

router.post(
	"/",
	permissionGuard("create_faq"),
	validateRequest(FaqValidation.createFaqZodSchema),
	FaqController.createFaq
);

router.get("/", FaqController.getAllFaqs);

router.get("/:id", FaqController.getSingleFaq);

router.patch(
	"/:id",
	permissionGuard("update_faq"),
	validateRequest(FaqValidation.updateFaqZodSchema),
	FaqController.updateFaq
);

router.delete("/:id", permissionGuard("delete_faq"), FaqController.deleteFaq);

export const FaqRoutes = router;
