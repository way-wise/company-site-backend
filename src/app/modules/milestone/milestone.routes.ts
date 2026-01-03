import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { MilestoneController } from "./milestone.controller";
import { milestoneValidationSchemas } from "./milestone.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/milestones:
 *   post:
 *     tags: [Milestones]
 *     summary: Create a new milestone
 *     description: Create a new milestone for a project. Requires 'create_milestone' permission.
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
 *               - name
 *               - projectId
 *               - index
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               projectId:
 *                 type: string
 *               index:
 *                 type: integer
 *               cost:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [PENDING, ONGOING, COMPLETED, REVIEW, APPROVED, REJECTED]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Milestone created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Milestones]
 *     summary: Get all milestones
 *     description: Retrieve all milestones with filtering and pagination. Requires 'read_milestone' permission.
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
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Milestones fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  permissionGuard("create_milestone"),
  validateRequest(milestoneValidationSchemas.create),
  MilestoneController.createMilestone
);

router.get(
  "/",
  permissionGuard("read_milestone"),
  MilestoneController.getAllMilestones
);

/**
 * @swagger
 * /api/v1/milestones/{id}:
 *   get:
 *     tags: [Milestones]
 *     summary: Get single milestone
 *     description: Retrieve a single milestone by ID. Requires 'read_milestone' permission.
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
 *         description: Milestone fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Milestone not found
 *   patch:
 *     tags: [Milestones]
 *     summary: Update milestone
 *     description: Update a milestone. Requires 'update_milestone' permission.
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               cost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Milestone updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Milestone not found
 *   delete:
 *     tags: [Milestones]
 *     summary: Delete milestone
 *     description: Delete a milestone. Requires 'delete_milestone' permission.
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
 *         description: Milestone deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Milestone not found
 */
router.get(
  "/:id",
  permissionGuard("read_milestone"),
  MilestoneController.getSingleMilestone
);

router.patch(
  "/:id",
  permissionGuard("update_milestone"),
  validateRequest(milestoneValidationSchemas.update),
  MilestoneController.updateMilestone
);

router.delete(
  "/:id",
  permissionGuard("delete_milestone"),
  MilestoneController.deleteMilestone
);

/**
 * @swagger
 * /api/v1/milestones/{id}/assign-employees:
 *   post:
 *     tags: [Milestones]
 *     summary: Assign employees to milestone
 *     description: Assign one or more employees to a milestone. Requires 'manage_milestones' permission.
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
 *               userProfileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Employees assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/milestones/{id}/assign-services:
 *   post:
 *     tags: [Milestones]
 *     summary: Assign services to milestone
 *     description: Assign one or more services to a milestone. Requires 'manage_milestones' permission.
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
 *               serviceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Services assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/:id/assign-employees",
  permissionGuard("manage_milestones"),
  validateRequest(milestoneValidationSchemas.assignEmployee),
  MilestoneController.assignEmployees
);

router.post(
  "/:id/assign-services",
  permissionGuard("manage_milestones"),
  validateRequest(milestoneValidationSchemas.assignService),
  MilestoneController.assignServices
);

export const MilestoneRoutes = router;
