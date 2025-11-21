import { Notification } from "@prisma/client";
import { broadcastToUser, isSSEInitialized } from "../sse";
import { NotificationService } from "../app/modules/notification/notification.service";
import { ICreateNotificationPayload } from "../app/modules/notification/notification.interface";

export const createAndEmitNotification = async (
  payload: ICreateNotificationPayload
): Promise<Notification> => {
  const notification = await NotificationService.createNotificationIntoDB(
    payload
  );

  try {
    if (!isSSEInitialized()) {
      return notification;
    }

    await broadcastToUser(payload.userProfileId, "notification:new", notification);
  } catch (error) {
    console.error(
      `Error emitting notification ${notification.id} via SSE:`,
      error instanceof Error ? error.message : error
    );
  }

  return notification;
};

