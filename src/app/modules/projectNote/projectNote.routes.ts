import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ProjectNoteController } from "./projectNote.controller";
import { projectNoteValidationSchemas } from "./projectNote.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/project-notes/{projectId}:
 *   get:
 *     tags: [Project Notes]
 *     summary: Get project note
 *     description: Get the note for a project. Requires 'read_project' permission.
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
 *         description: Note fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Note not found
 * /api/v1/project-notes:
 *   post:
 *     tags: [Project Notes]
 *     summary: Create or update project note
 *     description: Create or update a project note. Requires 'update_project' permission.
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
 *               - projectId
 *               - content
 *             properties:
 *               projectId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note created/updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/project-notes/{id}:
 *   put:
 *     tags: [Project Notes]
 *     summary: Update project note
 *     description: Update a project note. Requires 'update_project' permission.
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
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Note not found
 */
router.get(
  "/:projectId",
  permissionGuard("read_project"),
  ProjectNoteController.getNoteByProjectId
);

router.post(
  "/",
  permissionGuard("update_project"),
  validateRequest(projectNoteValidationSchemas.createOrUpdate),
  ProjectNoteController.createOrUpdateNote
);

router.put(
  "/:id",
  permissionGuard("update_project"),
  validateRequest(projectNoteValidationSchemas.update),
  ProjectNoteController.updateNote
);

export const ProjectNoteRoutes = router;

