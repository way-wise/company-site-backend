import express from "express";
import authGuard from "../../middlewares/authGuard";
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

router.get("/", authGuard(), ProjectController.getAllProjects);

router.get("/:id", authGuard(), ProjectController.getSingleProject);

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
