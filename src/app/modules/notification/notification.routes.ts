import express from "express";
import authGuard from "../../middlewares/authGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { NotificationController } from "./notification.controller";
import { notificationValidationSchemas } from "./notification.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get all notifications
 *     description: Get all notifications for the authenticated user. Requires authentication.
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
 *         name: read
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       401:
 *         description: Unauthorized
 * /api/v1/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread count
 *     description: Get count of unread notifications for the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Unread count fetched successfully
 *       401:
 *         description: Unauthorized
 * /api/v1/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all as read
 *     description: Mark all notifications as read for the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.get("/", authGuard(), NotificationController.getAllNotifications);

router.get("/unread-count", authGuard(), NotificationController.getUnreadCount);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get single notification
 *     description: Get a single notification by ID. Requires authentication.
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
 *         description: Notification fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete notification
 *     description: Delete a notification. Requires authentication.
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
 *         description: Notification deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     description: Mark a notification as read. Requires authentication.
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
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.get(
  "/:id",
  authGuard(),
  validateRequest(notificationValidationSchemas.getSingle),
  NotificationController.getSingleNotification
);

router.patch(
  "/:id/read",
  authGuard(),
  validateRequest(notificationValidationSchemas.markAsRead),
  NotificationController.markAsRead
);

router.patch("/read-all", authGuard(), NotificationController.markAllAsRead);

router.delete(
  "/:id",
  authGuard(),
  validateRequest(notificationValidationSchemas.deleteNotification),
  NotificationController.deleteNotification
);

export const NotificationRoutes = router;

