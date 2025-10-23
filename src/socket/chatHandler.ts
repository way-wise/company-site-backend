import { Server as SocketIOServer } from "socket.io";
import prisma from "../shared/prismaClient";
import { AuthenticatedSocket } from "./index";

// Socket event interfaces - exported for type safety
export interface SendMessageData {
  conversationId: string;
  content: string;
  attachments?: unknown[];
}

export interface EditMessageData {
  messageId: string;
  content: string;
}

export interface DeleteMessageData {
  messageId: string;
}

export interface TypingData {
  conversationId: string;
}

export interface ReadReceiptData {
  conversationId: string;
}

export interface JoinConversationData {
  conversationId: string;
}

export const registerChatHandlers = (
  io: SocketIOServer,
  socket: AuthenticatedSocket
) => {
  // Join conversation room
  socket.on("conversation:join", async (data: JoinConversationData) => {
    try {
      const { conversationId } = data;

      // Verify user is a participant
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userProfileId: socket.userProfileId,
        },
      });

      if (!participant) {
        socket.emit("error", {
          message: "Not authorized to join this conversation",
        });
        return;
      }

      // Join the socket room
      socket.join(conversationId);

      // Get all participants in this conversation
      const allParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userProfileId: true },
      });

      // Get all connected sockets in this conversation room
      const socketsInRoom = await io.in(conversationId).fetchSockets();
      const onlineUserProfileIds = socketsInRoom.map(
        (s) => (s as AuthenticatedSocket).userProfileId
      );

      // Send initial online status for all participants
      const participantStatuses = allParticipants.map((p) => ({
        userProfileId: p.userProfileId,
        status: onlineUserProfileIds.includes(p.userProfileId)
          ? "online"
          : "offline",
      }));

      socket.emit("conversation:initial-status", {
        conversationId,
        participants: participantStatuses,
      });

      console.log(`User ${socket.email} joined conversation ${conversationId}`);
    } catch (error) {
      console.error("Error joining conversation:", error);
      socket.emit("error", { message: "Failed to join conversation" });
    }
  });

  // Leave conversation room
  socket.on("conversation:leave", (data: JoinConversationData) => {
    const { conversationId } = data;
    socket.leave(conversationId);
    console.log(`User ${socket.email} left conversation ${conversationId}`);
  });

  // Send message
  socket.on("message:send", async (data: SendMessageData) => {
    try {
      const { conversationId, content, attachments } = data;

      // Verify user is a participant
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userProfileId: socket.userProfileId,
        },
      });

      if (!participant) {
        socket.emit("error", { message: "Not authorized to send messages" });
        return;
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: socket.userProfileId,
          content,
          attachments: attachments || undefined,
        },
        include: {
          sender: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              profilePhoto: true,
            },
          },
        },
      });

      // Update conversation's updatedAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Broadcast to all participants in the conversation room
      io.to(conversationId).emit("message:new", message);

      console.log(
        `Message sent in conversation ${conversationId} by ${socket.email}`
      );
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Edit message
  socket.on("message:edit", async (data: EditMessageData) => {
    try {
      const { messageId, content } = data;

      // Verify message belongs to user
      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (
        !existingMessage ||
        existingMessage.senderId !== socket.userProfileId
      ) {
        socket.emit("error", {
          message: "Not authorized to edit this message",
        });
        return;
      }

      // Update message
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          isEdited: true,
        },
        include: {
          sender: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              profilePhoto: true,
            },
          },
        },
      });

      // Broadcast to conversation participants
      io.to(existingMessage.conversationId).emit(
        "message:updated",
        updatedMessage
      );

      console.log(`Message ${messageId} edited by ${socket.email}`);
    } catch (error) {
      console.error("Error editing message:", error);
      socket.emit("error", { message: "Failed to edit message" });
    }
  });

  // Delete message
  socket.on("message:delete", async (data: DeleteMessageData) => {
    try {
      const { messageId } = data;

      // Verify message belongs to user
      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (
        !existingMessage ||
        existingMessage.senderId !== socket.userProfileId
      ) {
        socket.emit("error", {
          message: "Not authorized to delete this message",
        });
        return;
      }

      // Soft delete message
      const deletedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          content: "This message has been deleted",
        },
      });

      // Broadcast to conversation participants
      io.to(existingMessage.conversationId).emit("message:deleted", {
        messageId,
        conversationId: existingMessage.conversationId,
      });

      console.log(`Message ${messageId} deleted by ${socket.email}`);
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  });

  // Typing indicator - start
  socket.on("typing:start", async (data: TypingData) => {
    try {
      const { conversationId } = data;

      // Verify user is a participant
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userProfileId: socket.userProfileId,
        },
      });

      if (!participant) {
        return;
      }

      // Broadcast to other participants (not sender)
      socket.to(conversationId).emit("typing", {
        conversationId,
        userProfileId: socket.userProfileId,
        isTyping: true,
      });
    } catch (error) {
      console.error("Error handling typing start:", error);
    }
  });

  // Typing indicator - stop
  socket.on("typing:stop", async (data: TypingData) => {
    try {
      const { conversationId } = data;

      // Broadcast to other participants
      socket.to(conversationId).emit("typing", {
        conversationId,
        userProfileId: socket.userProfileId,
        isTyping: false,
      });
    } catch (error) {
      console.error("Error handling typing stop:", error);
    }
  });

  // Read receipt
  socket.on("message:read", async (data: ReadReceiptData) => {
    try {
      const { conversationId } = data;

      // Update last read timestamp
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userProfileId: socket.userProfileId,
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      // Broadcast read receipt to conversation
      io.to(conversationId).emit("read:receipt", {
        conversationId,
        userProfileId: socket.userProfileId,
        readAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating read receipt:", error);
    }
  });
};
