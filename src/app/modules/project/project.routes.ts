import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ProjectController } from "./project.controller";
import { projectValidationSchemas } from "./project.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project
 *     description: Create a new project. Requires 'create_project' permission.
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
 *               - userProfileId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACTIVE, COMPLETED, CANCELLED]
 *               userProfileId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Projects]
 *     summary: Get all projects
 *     description: Retrieve all projects with filtering and pagination. Requires 'view_all_projects' or 'read_project' permission.
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Projects fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  permissionGuard("create_project"),
  validateRequest(projectValidationSchemas.create),
  ProjectController.createProject
);

router.get(
  "/",
  permissionGuard("view_all_projects", "read_project"),
  ProjectController.getAllProjects
);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get single project
 *     description: Retrieve a single project by ID with all related data. Requires 'read_project' permission.
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
 *         description: Project fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 *   patch:
 *     tags: [Projects]
 *     summary: Update project
 *     description: Update a project. Requires 'update_project' permission.
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
 *                 enum: [PENDING, ACTIVE, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 *   delete:
 *     tags: [Projects]
 *     summary: Delete project
 *     description: Delete a project. Cannot delete if project has milestones. Requires 'delete_project' permission.
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
 *         description: Project deleted successfully
 *       400:
 *         description: Cannot delete project with milestones
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 */
router.get(
  "/:id",
  permissionGuard("read_project"),
  ProjectController.getSingleProject
);

router.patch(
  "/:id",
  permissionGuard("update_project"),
  validateRequest(projectValidationSchemas.update),
  ProjectController.updateProject
);

router.delete(
  "/:id",
  permissionGuard("delete_project"),
  ProjectController.deleteProject
);

export const ProjectRoutes = router;
