import express from "express";
import roleGuard from "../../middlewares/roleGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { TaskController } from "./task.controller";
import { taskValidationSchemas } from "./task.validationSchema";

const router = express.Router();

router.post(
  "/",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(taskValidationSchemas.create),
  TaskController.createTask
);

router.get("/", TaskController.getAllTasks);

router.get("/:id", TaskController.getSingleTask);

router.patch(
  "/:id",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(taskValidationSchemas.update),
  TaskController.updateTask
);

router.delete(
  "/:id",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  TaskController.deleteTask
);

router.post(
  "/:id/assign-employees",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(taskValidationSchemas.assignEmployee),
  TaskController.assignEmployees
);

router.post(
  "/:id/comments",
  validateRequest(taskValidationSchemas.addComment),
  TaskController.addComment
);

router.patch(
  "/:id/progress",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(taskValidationSchemas.updateProgress),
  TaskController.updateProgress
);

router.patch(
  "/:id/time-tracking",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(taskValidationSchemas.updateTimeTracking),
  TaskController.updateTimeTracking
);

export const TaskRoutes = router;



