import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { TaskController } from "./task.controller";
import { taskValidationSchemas } from "./task.validationSchema";

const router = express.Router();

router.post(
  "/",
  permissionGuard("create_task"),
  validateRequest(taskValidationSchemas.create),
  TaskController.createTask
);

router.get("/", permissionGuard("read_task"), TaskController.getAllTasks);

router.get("/:id", permissionGuard("read_task"), TaskController.getSingleTask);

router.patch(
  "/:id",
  permissionGuard("update_task"),
  validateRequest(taskValidationSchemas.update),
  TaskController.updateTask
);

router.delete(
  "/:id",
  permissionGuard("delete_task"),
  TaskController.deleteTask
);

router.post(
  "/:id/assign-employees",
  permissionGuard("assign_task"),
  validateRequest(taskValidationSchemas.assignEmployee),
  TaskController.assignEmployees
);

router.post(
  "/:id/comments",
  permissionGuard("add_comment"),
  validateRequest(taskValidationSchemas.addComment),
  TaskController.addComment
);

router.patch(
  "/:id/progress",
  permissionGuard("update_progress"),
  validateRequest(taskValidationSchemas.updateProgress),
  TaskController.updateProgress
);

router.patch(
  "/:id/time-tracking",
  permissionGuard("update_time_tracking"),
  validateRequest(taskValidationSchemas.updateTimeTracking),
  TaskController.updateTimeTracking
);

export const TaskRoutes = router;
