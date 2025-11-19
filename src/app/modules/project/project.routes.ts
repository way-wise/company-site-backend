import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ProjectController } from "./project.controller";
import { projectValidationSchemas } from "./project.validationSchema";

const router = express.Router();

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
