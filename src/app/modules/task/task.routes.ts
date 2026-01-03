import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { TaskController } from "./task.controller";
import { taskValidationSchemas } from "./task.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     description: Create a new task. Requires 'create_task' permission.
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
 *               - title
 *               - milestoneId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               milestoneId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, BLOCKED, REVIEW, DONE]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               estimatedHours:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Tasks]
 *     summary: Get all tasks
 *     description: Retrieve all tasks with filtering and pagination. Requires 'read_task' permission.
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
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tasks fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  permissionGuard("create_task"),
  validateRequest(taskValidationSchemas.create),
  TaskController.createTask
);

router.get("/", permissionGuard("read_task"), TaskController.getAllTasks);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get single task
 *     description: Retrieve a single task by ID. Requires 'read_task' permission.
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
 *         description: Task fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task
 *     description: Update a task. Requires 'update_task' permission.
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
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete task
 *     description: Delete a task. Requires 'delete_task' permission.
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
 *         description: Task deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
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

/**
 * @swagger
 * /api/v1/tasks/{id}/assign-employees:
 *   post:
 *     tags: [Tasks]
 *     summary: Assign employees to task
 *     description: Assign one or more employees to a task. Requires 'assign_task' permission.
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
 *               userProfileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Employees assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/tasks/{id}/comments:
 *   post:
 *     tags: [Tasks]
 *     summary: Add comment to task
 *     description: Add a comment to a task. Requires 'add_comment' permission.
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
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/tasks/{id}/progress:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task progress
 *     description: Update the progress percentage of a task. Requires 'update_progress' permission.
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
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/tasks/{id}/time-tracking:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update time tracking
 *     description: Update time tracking information for a task. Requires 'update_time_tracking' permission.
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
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Time tracking updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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
