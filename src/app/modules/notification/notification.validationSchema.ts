import { z } from "zod";

const markAsRead = z.object({
  params: z.object({
    id: z.string().min(1, "Notification ID is required"),
  }),
});

const getSingle = z.object({
  params: z.object({
    id: z.string().min(1, "Notification ID is required"),
  }),
});

const deleteNotification = z.object({
  params: z.object({
    id: z.string().min(1, "Notification ID is required"),
  }),
});

export const notificationValidationSchemas = {
  markAsRead,
  getSingle,
  deleteNotification,
};

