import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { fileUploader } from "../../../helpers/fileUploader";
import { NewLiveProjectController } from "./newLiveProject.controller";
import { newLiveProjectValidationSchemas } from "./newLiveProject.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/new-live-projects:
 *   post:
 *     tags: [New Live Projects]
 *     summary: Create a new live project
 *     description: Create a new live project with client information, budget, and assigned members. Requires 'create_new_live_project' permission.
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
 *               - projectName
 *               - projectType
 *               - assignedMembers
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: "E-commerce Platform Development"
 *               clientName:
 *                 type: string
 *                 example: "Acme Corporation"
 *               clientLocation:
 *                 type: string
 *                 example: "New York, USA"
 *               assignedMembers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["John Doe", "Jane Smith"]
 *               projectType:
 *                 type: string
 *                 enum: [FIXED, HOURLY]
 *                 example: "FIXED"
 *               projectStatus:
 *                 type: string
 *                 enum: [PENDING, ACTIVE, COMPLETED, CANCEL, ARCHIVED]
 *                 default: PENDING
 *               projectBudget:
 *                 type: number
 *                 example: 50000
 *                 description: "Required for FIXED projects"
 *               paidAmount:
 *                 type: number
 *                 default: 0
 *                 example: 0
 *                 description: "Required for FIXED projects"
 *               weeklyLimit:
 *                 type: number
 *                 example: 40
 *                 description: "Required for HOURLY projects (hours per week)"
 *               hourlyRate:
 *                 type: number
 *                 example: 50
 *                 nullable: true
 *                 description: "Optional hourly rate (typically for HOURLY projects)"
 *               paidHours:
 *                 type: number
 *                 example: 120.5
 *                 nullable: true
 *                 description: "Auto-calculated: sum of all hour logs (for HOURLY projects, read-only)"
 *               progress:
 *                 type: number
 *                 example: 25
 *                 nullable: true
 *                 minimum: 0
 *                 maximum: 100
 *                 description: "Optional progress percentage (0-100)"
 *               committedDeadline:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               targetedDeadline:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   backend:
 *                     type: string
 *                     format: date-time
 *                   frontend:
 *                     type: string
 *                     format: date-time
 *                   ui:
 *                     type: string
 *                     format: date-time
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: New live project created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [New Live Projects]
 *     summary: Get all new live projects
 *     description: Retrieve all new live projects with filtering, searching, and pagination. Requires 'read_new_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: projectType
 *         schema:
 *           type: string
 *           enum: [FIXED, HOURLY]
 *       - in: query
 *         name: projectStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, COMPLETED, CANCEL, ARCHIVED]
 *     responses:
 *       200:
 *         description: New live projects fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  permissionGuard("create_new_live_project"),
  validateRequest(newLiveProjectValidationSchemas.create),
  NewLiveProjectController.createNewLiveProject
);

router.get(
  "/",
  permissionGuard("read_new_live_project"),
  NewLiveProjectController.getAllNewLiveProjects
);

/**
 * @swagger
 * /api/v1/new-live-projects/{id}:
 *   get:
 *     tags: [New Live Projects]
 *     summary: Get single new live project
 *     description: Retrieve a single new live project by ID. Requires 'read_new_live_project' permission.
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
 *         description: New live project fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *   put:
 *     tags: [New Live Projects]
 *     summary: Update new live project
 *     description: Update a new live project. Due amount is automatically recalculated (projectBudget - paidAmount) for fixed projects. Requires 'update_new_live_project' permission.
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
 *               projectName:
 *                 type: string
 *               clientName:
 *                 type: string
 *               clientLocation:
 *                 type: string
 *               assignedMembers:
 *                 type: array
 *                 items:
 *                   type: string
 *               projectType:
 *                 type: string
 *                 enum: [FIXED, HOURLY]
 *               projectStatus:
 *                 type: string
 *                 enum: [PENDING, ACTIVE, COMPLETED, CANCEL, ARCHIVED]
 *               projectBudget:
 *                 type: number
 *               paidAmount:
 *                 type: number
 *               weeklyLimit:
 *                 type: number
 *               hourlyRate:
 *                 type: number
 *                 nullable: true
 *                 description: "Optional hourly rate (typically for HOURLY projects)"
 *               paidHours:
 *                 type: number
 *                 nullable: true
 *                 description: "Auto-calculated: sum of all hour logs (for HOURLY projects, read-only)"
 *               progress:
 *                 type: number
 *                 nullable: true
 *                 minimum: 0
 *                 maximum: 100
 *                 description: "Optional progress percentage (0-100)"
 *               committedDeadline:
 *                 type: string
 *                 format: date-time
 *               targetedDeadline:
 *                 type: object
 *                 properties:
 *                   backend:
 *                     type: string
 *                     format: date-time
 *                   frontend:
 *                     type: string
 *                     format: date-time
 *                   ui:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       200:
 *         description: New live project updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *   delete:
 *     tags: [New Live Projects]
 *     summary: Delete new live project (soft delete)
 *     description: Soft delete a new live project by setting status to ARCHIVED. Requires 'delete_new_live_project' permission.
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
 *         description: New live project archived successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  permissionGuard("read_new_live_project"),
  NewLiveProjectController.getSingleNewLiveProject
);

router.put(
  "/:id",
  permissionGuard("update_new_live_project"),
  validateRequest(newLiveProjectValidationSchemas.update),
  NewLiveProjectController.updateNewLiveProject
);

router.delete(
  "/:id",
  permissionGuard("delete_new_live_project"),
  NewLiveProjectController.deleteNewLiveProject
);

/**
 * @swagger
 * /api/v1/new-live-projects/{projectId}/documents:
 *   post:
 *     tags: [New Live Projects]
 *     summary: Upload document to project
 *     description: Upload a document to a project. Documents are appended to the documents array and never overwritten. Requires 'update_new_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 */
router.post(
  "/:projectId/documents",
  permissionGuard("update_new_live_project"),
  fileUploader.upload.single("file"),
  NewLiveProjectController.uploadDocument
);

/**
 * @swagger
 * /api/v1/new-live-projects/{projectId}/actions:
 *   post:
 *     tags: [New Live Projects]
 *     summary: Create project action
 *     description: Create a new action for a project. Latest action is treated as the "Next Action". Requires 'update_new_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actionText
 *             properties:
 *               actionText:
 *                 type: string
 *                 example: "Review design mockups and provide feedback"
 *               actionDate:
 *                 type: string
 *                 format: date-time
 *                 description: "Optional, defaults to current date"
 *     responses:
 *       201:
 *         description: Project action created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 *   get:
 *     tags: [New Live Projects]
 *     summary: Get project actions
 *     description: Get all actions for a project, ordered by date (latest first). Requires 'read_new_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project actions fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 */
router.post(
  "/:projectId/actions",
  permissionGuard("update_new_live_project"),
  validateRequest(newLiveProjectValidationSchemas.createAction),
  NewLiveProjectController.createProjectAction
);

router.get(
  "/:projectId/actions",
  permissionGuard("read_new_live_project"),
  NewLiveProjectController.getProjectActions
);

/**
 * @swagger
 * /api/v1/new-live-projects/{projectId}/actions/{actionId}:
 *   put:
 *     tags: [New Live Projects]
 *     summary: Update project action
 *     description: Update an existing action for a project. Requires 'update_new_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: actionId
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
 *               actionText:
 *                 type: string
 *                 example: "Review design mockups and provide feedback"
 *                 description: "Optional, update action text"
 *               actionDate:
 *                 type: string
 *                 format: date-time
 *                 description: "Optional, update action date"
 *     responses:
 *       200:
 *         description: Project action updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Action not found
 *   delete:
 *     tags: [New Live Projects]
 *     summary: Delete project action
 *     description: Delete an action from a project. Requires 'update_new_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project action deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Action not found
 */
router.put(
  "/:projectId/actions/:actionId",
  permissionGuard("update_new_live_project"),
  validateRequest(newLiveProjectValidationSchemas.updateAction),
  NewLiveProjectController.updateProjectAction
);

router.delete(
  "/:projectId/actions/:actionId",
  permissionGuard("update_new_live_project"),
  NewLiveProjectController.deleteProjectAction
);

/**
 * @swagger
 * /api/v1/new-live-projects/{projectId}/hours:
 *   post:
 *     tags: [New Live Projects]
 *     summary: Create hour log
 *     description: Create or update an hour log for an hourly project. Each day users can submit worked hours. Requires 'update_new_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - submittedHours
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T00:00:00Z"
 *               submittedHours:
 *                 type: number
 *                 example: 8
 *                 description: "Hours worked (max 24 per day)"
 *     responses:
 *       201:
 *         description: Hour log created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 *   get:
 *     tags: [New Live Projects]
 *     summary: Get hour logs
 *     description: Get all hour logs for an hourly project, ordered by date (latest first). Requires 'read_new_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hour logs fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 */
/**
 * @swagger
 * /api/v1/new-live-projects/{projectId}/hours/{hourLogId}:
 *   put:
 *     tags: [New Live Projects]
 *     summary: Update hour log
 *     description: Update an existing hour log entry. Requires 'update_new_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: hourLogId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - submittedHours
 *             properties:
 *               submittedHours:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 24
 *                 example: 6.5
 *                 description: "Updated hours worked (max 24 per day)"
 *     responses:
 *       200:
 *         description: Hour log updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Hour log not found
 *   delete:
 *     tags: [New Live Projects]
 *     summary: Delete hour log
 *     description: Delete an hour log entry. Requires 'update_new_live_project' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: hourLogId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hour log deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Hour log not found
 */

router.post(
  "/:projectId/hours",
  permissionGuard("update_new_live_project"),
  validateRequest(newLiveProjectValidationSchemas.createHourLog),
  NewLiveProjectController.createHourLog
);

router.get(
  "/:projectId/hours",
  permissionGuard("read_new_live_project"),
  NewLiveProjectController.getHourLogs
);

router.put(
  "/:projectId/hours/:hourLogId",
  permissionGuard("update_new_live_project"),
  validateRequest(newLiveProjectValidationSchemas.updateHourLog),
  NewLiveProjectController.updateHourLog
);

router.delete(
  "/:projectId/hours/:hourLogId",
  permissionGuard("update_new_live_project"),
  NewLiveProjectController.deleteHourLog
);

export const NewLiveProjectRoutes = router;
