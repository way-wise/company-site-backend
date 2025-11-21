import { Notification } from "@prisma/client";
import { getIO, isSocketInitialized } from "../socket";
import { NotificationService } from "../app/modules/notification/notification.service";
import { ICreateNotificationPayload } from "../app/modules/notification/notification.interface";

/**
 * Creates a notification in the database and emits it via Socket.io to the user
 * @param payload - Notification data
 * @returns Created notification
 */
export const createAndEmitNotification = async (
  payload: ICreateNotificationPayload
): Promise<Notification> => {
  // Create notification in database first (always succeeds even if socket fails)
  const notification = await NotificationService.createNotificationIntoDB(
    payload
  );

  console.log(
    `📬 Notification created: ${notification.id} for user ${payload.userProfileId} (${payload.type})`
  );

  // Emit notification via Socket.io to user's personal room
  try {
    // Check if socket is initialized before attempting to emit
    if (!isSocketInitialized()) {
      console.warn(
        `⚠️ Socket.io not initialized. Notification ${notification.id} saved to DB but not emitted.`
      );
      return notification;
    }

    const io = getIO();
    const roomName = `user:${payload.userProfileId}`;
    
    // Emit to user's personal room
    io.to(roomName).emit("notification:new", notification);
    
    // Check if anyone is in the room (for debugging)
    const socketsInRoom = await io.in(roomName).fetchSockets();
    if (socketsInRoom.length > 0) {
      console.log(
        `✅ Notification ${notification.id} emitted to room ${roomName} (${socketsInRoom.length} socket(s) connected)`
      );
    } else {
      console.log(
        `ℹ️ Notification ${notification.id} emitted to room ${roomName} but no sockets connected (user offline)`
      );
    }
  } catch (error) {
    // Log error but don't fail - notification is already saved to DB
    console.error(
      `❌ Error emitting notification ${notification.id} via Socket.io:`,
      error instanceof Error ? error.message : error
    );
  }

  return notification;
};

