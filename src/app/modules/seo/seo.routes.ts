import express from "express";
import { SeoController } from "./seo.controller";
import { SeoValidation } from "./seo.validation";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";

const router = express.Router();

/**
 * @swagger
 * /api/v1/seo:
 *   post:
 *     tags: [SEO]
 *     summary: Create a new SEO setting
 *     description: Create SEO settings for a page. Requires 'manage_seo' permission.
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
 *               - pageSlug
 *               - pageName
 *               - metaTitle
 *               - metaDescription
 *             properties:
 *               pageSlug:
 *                 type: string
 *               pageName:
 *                 type: string
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               ogTitle:
 *                 type: string
 *               ogDescription:
 *                 type: string
 *               ogImage:
 *                 type: string
 *               twitterTitle:
 *                 type: string
 *               twitterDescription:
 *                 type: string
 *               twitterImage:
 *                 type: string
 *               canonicalUrl:
 *                 type: string
 *               robotsIndex:
 *                 type: boolean
 *               robotsFollow:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: SEO setting created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [SEO]
 *     summary: Get all SEO settings
 *     description: Retrieve all SEO settings. Requires 'manage_seo' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
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
 *         name: searchTerm
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: SEO settings fetched successfully
 */
router.post(
  "/",
  permissionGuard("manage_seo"),
  validateRequest(SeoValidation.createSeoZodSchema),
  SeoController.createSeo
);

router.get("/", permissionGuard("manage_seo"), SeoController.getAllSeoSettings);

/**
 * @swagger
 * /api/v1/seo/upsert:
 *   post:
 *     tags: [SEO]
 *     summary: Create or update SEO setting
 *     description: Create or update SEO settings for a page by slug. Requires 'manage_seo' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeoInput'
 *     responses:
 *       200:
 *         description: SEO setting saved successfully
 */
router.post(
  "/upsert",
  permissionGuard("manage_seo"),
  validateRequest(SeoValidation.createSeoZodSchema),
  SeoController.upsertSeo
);

/**
 * @swagger
 * /api/v1/seo/slug/{slug}:
 *   get:
 *     tags: [SEO]
 *     summary: Get SEO by page slug
 *     description: Retrieve SEO settings for a specific page by slug (public endpoint)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SEO setting fetched successfully
 *       404:
 *         description: SEO setting not found
 */
router.get("/slug/:slug", SeoController.getSeoBySlug);

/**
 * @swagger
 * /api/v1/seo/{id}:
 *   get:
 *     tags: [SEO]
 *     summary: Get single SEO setting
 *     description: Retrieve a single SEO setting by ID. Requires 'manage_seo' permission.
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
 *         description: SEO setting fetched successfully
 *       404:
 *         description: SEO setting not found
 *   patch:
 *     tags: [SEO]
 *     summary: Update SEO setting
 *     description: Update SEO settings. Requires 'manage_seo' permission.
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
 *             $ref: '#/components/schemas/SeoUpdateInput'
 *     responses:
 *       200:
 *         description: SEO setting updated successfully
 *   delete:
 *     tags: [SEO]
 *     summary: Delete SEO setting
 *     description: Delete SEO settings. Requires 'manage_seo' permission.
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
 *         description: SEO setting deleted successfully
 */
router.get("/:id", permissionGuard("manage_seo"), SeoController.getSingleSeo);

router.patch(
  "/:id",
  permissionGuard("manage_seo"),
  validateRequest(SeoValidation.updateSeoZodSchema),
  SeoController.updateSeo
);

router.delete("/:id", permissionGuard("manage_seo"), SeoController.deleteSeo);

export const SeoRoutes = router;
