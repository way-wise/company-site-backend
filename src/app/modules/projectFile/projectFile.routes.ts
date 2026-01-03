import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { fileUploader } from "../../../helpers/fileUploader";
import { ProjectFileController } from "./projectFile.controller";
import { projectFileValidationSchemas } from "./projectFile.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/project-files/{projectId}:
 *   get:
 *     tags: [Project Files]
 *     summary: Get project files
 *     description: Get all files for a project. Requires 'read_project' permission.
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
 *         description: Files fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/project-files:
 *   post:
 *     tags: [Project Files]
 *     summary: Upload project file
 *     description: Upload a file to a project. Requires 'update_project' permission.
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
 *               - file
 *               - projectId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/project-files/{id}:
 *   delete:
 *     tags: [Project Files]
 *     summary: Delete project file
 *     description: Delete a project file. Requires 'update_project' permission.
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
 *         description: File deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: File not found
 */
router.get(
  "/:projectId",
  permissionGuard("read_project"),
  ProjectFileController.getFilesByProjectId
);

router.post(
  "/",
  permissionGuard("update_project"),
  fileUploader.upload.single("file"),
  ProjectFileController.uploadFile
);

router.delete(
  "/:id",
  permissionGuard("update_project"),
  ProjectFileController.deleteFile
);

export const ProjectFileRoutes = router;

