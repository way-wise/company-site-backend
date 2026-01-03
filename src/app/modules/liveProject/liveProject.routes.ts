import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { LiveProjectController } from "./liveProject.controller";
import { liveProjectValidationSchemas } from "./liveProject.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/live-projects:
 *   post:
 *     tags: [Live Projects]
 *     summary: Create a new live project
 *     description: Create a new live project with client information, budget, and assigned members. Requires 'create_live_project' permission.
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
 *               - clientName
 *               - projectType
 *               - projectBudget
 *               - assignedMembers
 *             properties:
 *               clientName:
 *                 type: string
 *                 example: "Acme Corporation"
 *               clientLocation:
 *                 type: string
 *                 example: "New York, USA"
 *               projectType:
 *                 type: string
 *                 enum: [FIXED, HOURLY]
 *                 example: "FIXED"
 *                 description: "FIXED = total budget, HOURLY = hourly rate"
 *               projectBudget:
 *                 type: number
 *                 example: 50000
 *                 description: "For FIXED = total budget, for HOURLY = hourly rate"
 *               paidAmount:
 *                 type: number
 *                 default: 0
 *                 example: 0
 *               assignedMembers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user-profile-id-1", "user-profile-id-2"]
 *                 description: "Array of user profile IDs"
 *               projectStatus:
 *                 type: string
 *                 enum: [PENDING, ACTIVE, ON_HOLD, COMPLETED]
 *                 default: PENDING
 *                 example: "PENDING"
 *               dailyNotes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     note:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 description: "Optional initial daily notes"
 *               nextActions:
 *                 type: string
 *                 example: "Review design mockups and provide feedback"
 *     responses:
 *       201:
 *         description: Live project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - Invalid data or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 *   get:
 *     tags: [Live Projects]
 *     summary: Get all live projects
 *     description: Retrieve all live projects with filtering, searching, and pagination. Requires 'read_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term (searches clientName, clientLocation, nextActions)
 *       - in: query
 *         name: clientName
 *         schema:
 *           type: string
 *         description: Filter by client name
 *       - in: query
 *         name: clientLocation
 *         schema:
 *           type: string
 *         description: Filter by client location
 *       - in: query
 *         name: projectType
 *         schema:
 *           type: string
 *           enum: [FIXED, HOURLY]
 *         description: Filter by project type
 *       - in: query
 *         name: projectStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, ON_HOLD, COMPLETED]
 *         description: Filter by project status
 *     responses:
 *       200:
 *         description: Live projects fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  permissionGuard("create_live_project"),
  validateRequest(liveProjectValidationSchemas.create),
  LiveProjectController.createLiveProject
);

router.get(
  "/",
  permissionGuard("read_live_project"),
  LiveProjectController.getAllLiveProjects
);

/**
 * @swagger
 * /api/v1/live-projects/{id}:
 *   get:
 *     tags: [Live Projects]
 *     summary: Get single live project
 *     description: Retrieve a single live project by ID. Requires 'read_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Live project ID
 *     responses:
 *       200:
 *         description: Live project fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Live project not found
 *   put:
 *     tags: [Live Projects]
 *     summary: Update live project
 *     description: Update a live project. Due amount is automatically recalculated (projectBudget - paidAmount). Daily notes are appended, not overwritten. Requires 'update_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Live project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientName:
 *                 type: string
 *               clientLocation:
 *                 type: string
 *               projectType:
 *                 type: string
 *                 enum: [FIXED, HOURLY]
 *               projectBudget:
 *                 type: number
 *               paidAmount:
 *                 type: number
 *               assignedMembers:
 *                 type: array
 *                 items:
 *                   type: string
 *               projectStatus:
 *                 type: string
 *                 enum: [PENDING, ACTIVE, ON_HOLD, COMPLETED]
 *               dailyNotes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     note:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                 description: "New notes to append (existing notes are preserved)"
 *               nextActions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Live project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Live project not found
 *   delete:
 *     tags: [Live Projects]
 *     summary: Delete live project
 *     description: Delete a live project by ID. Requires 'delete_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Live project ID
 *     responses:
 *       200:
 *         description: Live project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Live project not found
 */
router.get(
  "/:id",
  permissionGuard("read_live_project"),
  LiveProjectController.getSingleLiveProject
);

router.put(
  "/:id",
  permissionGuard("update_live_project"),
  validateRequest(liveProjectValidationSchemas.update),
  LiveProjectController.updateLiveProject
);

router.delete(
  "/:id",
  permissionGuard("delete_live_project"),
  LiveProjectController.deleteLiveProject
);

/**
 * @swagger
 * /api/v1/live-projects/{id}/daily-notes:
 *   post:
 *     tags: [Live Projects]
 *     summary: Add daily note to live project
 *     description: Append a daily note to a live project. Notes are append-only and cannot be deleted. Requires 'update_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Live project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *                 example: "Client approved the initial design mockups"
 *     responses:
 *       200:
 *         description: Daily note added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Live project not found
 */
router.post(
  "/:id/daily-notes",
  permissionGuard("update_live_project"),
  validateRequest(liveProjectValidationSchemas.addDailyNote),
  LiveProjectController.addDailyNote
);

export const LiveProjectRoutes = router;

