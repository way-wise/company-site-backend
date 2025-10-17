import express from "express";
import roleGuard from "../../middlewares/roleGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ProjectController } from "./project.controller";
import { projectValidationSchemas } from "./project.validationSchema";

const router = express.Router();

router.post(
  "/",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(projectValidationSchemas.create),
  ProjectController.createProject
);

router.get("/", ProjectController.getAllProjects);

router.get("/:id", ProjectController.getSingleProject);

router.patch(
  "/:id",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(projectValidationSchemas.update),
  ProjectController.updateProject
);

router.delete(
  "/:id",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  ProjectController.deleteProject
);

export const ProjectRoutes = router;
