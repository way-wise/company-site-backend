import express from "express";
import authGuard from "../../middlewares/authGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { NotificationController } from "./notification.controller";
import { notificationValidationSchemas } from "./notification.validationSchema";

const router = express.Router();

// All notification routes require authentication
router.get("/", authGuard(), NotificationController.getAllNotifications);

router.get("/unread-count", authGuard(), NotificationController.getUnreadCount);

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

