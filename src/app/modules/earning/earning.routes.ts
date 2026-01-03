import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { EarningController } from "./earning.controller";
import { earningValidationSchemas } from "./earning.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/earnings:
 *   post:
 *     tags: [Earnings]
 *     summary: Create earning
 *     description: Create a new earning record. Requires 'create_earning' permission.
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
 *               - amount
 *               - date
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               projectId:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Earning created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Earnings]
 *     summary: Get all earnings
 *     description: Get all earnings with filtering and pagination. Requires 'read_earning' permission.
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
 *     responses:
 *       200:
 *         description: Earnings fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/earnings/stats:
 *   get:
 *     tags: [Earnings]
 *     summary: Get earning statistics
 *     description: Get earning statistics. Requires 'read_earning' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Statistics fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/earnings/project-earnings:
 *   get:
 *     tags: [Earnings]
 *     summary: Get project earnings
 *     description: Get earnings grouped by project. Requires 'read_earning' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Project earnings fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/earnings/{id}:
 *   get:
 *     tags: [Earnings]
 *     summary: Get single earning
 *     description: Get a single earning by ID. Requires 'read_earning' permission.
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
 *         description: Earning fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Earning not found
 *   patch:
 *     tags: [Earnings]
 *     summary: Update earning
 *     description: Update an earning. Requires 'update_earning' permission.
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
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Earning updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Earning not found
 *   delete:
 *     tags: [Earnings]
 *     summary: Delete earning
 *     description: Delete an earning. Requires 'delete_earning' permission.
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
 *         description: Earning deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Earning not found
 */
router.post(
  "/",
  permissionGuard("create_earning"),
  validateRequest(earningValidationSchemas.create),
  EarningController.createEarning
);

router.get(
  "/",
  permissionGuard("read_earning"),
  EarningController.getAllEarnings
);

router.get(
  "/stats",
  permissionGuard("read_earning"),
  EarningController.getEarningStats
);

router.get(
  "/project-earnings",
  permissionGuard("read_earning"),
  EarningController.getProjectEarnings
);

router.get(
  "/:id",
  permissionGuard("read_earning"),
  EarningController.getSingleEarning
);

router.patch(
  "/:id",
  permissionGuard("update_earning"),
  validateRequest(earningValidationSchemas.update),
  EarningController.updateEarning
);

router.delete(
  "/:id",
  permissionGuard("delete_earning"),
  EarningController.deleteEarning
);

export const EarningRoutes = router;

