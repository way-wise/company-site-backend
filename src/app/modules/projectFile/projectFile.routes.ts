import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { fileUploader } from "../../../helpers/fileUploader";
import { ProjectFileController } from "./projectFile.controller";
import { projectFileValidationSchemas } from "./projectFile.validationSchema";

const router = express.Router();

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

