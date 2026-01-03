import express from "express";

import { FaqController } from "./faq.controller";
import { FaqValidation } from "./faq.validation";

import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";

const router = express.Router();

/**
 * @swagger
 * /api/v1/faqs:
 *   post:
 *     tags: [FAQs]
 *     summary: Create a new FAQ
 *     description: Create a new frequently asked question. Requires 'create_faq' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               category:
 *                 type: string
 *                 default: "General"
 *               isShow:
 *                 type: boolean
 *                 default: true
 *               order:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: FAQ created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [FAQs]
 *     summary: Get all FAQs
 *     description: Retrieve all FAQs (public endpoint, no authentication required)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isShow
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQs fetched successfully
 */
router.post(
	"/",
	permissionGuard("create_faq"),
	validateRequest(FaqValidation.createFaqZodSchema),
	FaqController.createFaq
);

router.get("/", FaqController.getAllFaqs);

/**
 * @swagger
 * /api/v1/faqs/{id}:
 *   get:
 *     tags: [FAQs]
 *     summary: Get single FAQ
 *     description: Retrieve a single FAQ by ID (public endpoint)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ fetched successfully
 *       404:
 *         description: FAQ not found
 *   patch:
 *     tags: [FAQs]
 *     summary: Update FAQ
 *     description: Update a FAQ. Requires 'update_faq' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               category:
 *                 type: string
 *               isShow:
 *                 type: boolean
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: FAQ updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: FAQ not found
 *   delete:
 *     tags: [FAQs]
 *     summary: Delete FAQ
 *     description: Delete a FAQ. Requires 'delete_faq' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: FAQ not found
 */
router.get("/:id", FaqController.getSingleFaq);

router.patch(
	"/:id",
	permissionGuard("update_faq"),
	validateRequest(FaqValidation.updateFaqZodSchema),
	FaqController.updateFaq
);

router.delete("/:id", permissionGuard("delete_faq"), FaqController.deleteFaq);

export const FaqRoutes = router;
