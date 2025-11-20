import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ProjectNoteController } from "./projectNote.controller";
import { projectNoteValidationSchemas } from "./projectNote.validationSchema";

const router = express.Router();

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

