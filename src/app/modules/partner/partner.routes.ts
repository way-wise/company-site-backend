import express from "express";
import { fileUploader } from "../../../helpers/fileUploader";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { PartnerController } from "./partner.controller";
import { partnerValidationSchemas } from "./partner.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/partner/public:
 *   get:
 *     tags: [Partner]
 *     summary: Get public partners
 *     description: Get all visible partners (public endpoint, no authentication required)
 *     responses:
 *       200:
 *         description: Partners fetched successfully
 */
router.get("/public", PartnerController.getPublicPartners);

/**
 * @swagger
 * /api/v1/partner:
 *   post:
 *     tags: [Partner]
 *     summary: Create partner
 *     description: Create a new partner with image upload. Requires 'create_partner' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isShow:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Partner created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Partner]
 *     summary: Get all partners
 *     description: Get all partners. Requires 'read_partner' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Partners fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/partner/{id}:
 *   get:
 *     tags: [Partner]
 *     summary: Get single partner
 *     description: Get a single partner by ID. Requires 'read_partner' permission.
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
 *         description: Partner fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Partner not found
 *   put:
 *     tags: [Partner]
 *     summary: Update partner
 *     description: Update a partner. Requires 'update_partner' permission.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isShow:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Partner updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Partner not found
 *   delete:
 *     tags: [Partner]
 *     summary: Delete partner
 *     description: Delete a partner. Requires 'delete_partner' permission.
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
 *         description: Partner deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Partner not found
 * /api/v1/partner/{id}/toggle-visibility:
 *   patch:
 *     tags: [Partner]
 *     summary: Toggle partner visibility
 *     description: Toggle partner visibility (isShow). Requires 'toggle_partner_visibility' permission.
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
 *               isShow:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Visibility toggled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Partner not found
 */
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

