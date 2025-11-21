import { Response } from "express";
import prisma from "../shared/prismaClient";

const connections = new Map<string, Set<Response>>();
const HEARTBEAT_INTERVAL = 30000;

export const addConnection = (userProfileId: string, res: Response): void => {
  if (!connections.has(userProfileId)) {
    connections.set(userProfileId, new Set());
  }
  
  const userConnections = connections.get(userProfileId)!;
  userConnections.add(res);

  const heartbeatInterval = setInterval(() => {
    try {
      if (!res.destroyed) {
        res.write(": heartbeat\n\n");
        // Flush heartbeat to prevent buffering
        if (typeof (res as any).flush === "function") {
          (res as any).flush();
        }
      } else {
        clearInterval(heartbeatInterval);
        removeConnection(userProfileId, res);
      }
    } catch (error) {
      clearInterval(heartbeatInterval);
      removeConnection(userProfileId, res);
    }
  }, HEARTBEAT_INTERVAL);

  (res as any).heartbeatInterval = heartbeatInterval;

  res.on("close", () => {
    clearInterval(heartbeatInterval);
    removeConnection(userProfileId, res);
  });
};

export const removeConnection = (userProfileId: string, res: Response): void => {
  const userConnections = connections.get(userProfileId);
  if (userConnections) {
    userConnections.delete(res);
    
    if (userConnections.size === 0) {
      connections.delete(userProfileId);
    }
  }
};

export const broadcastToUser = async (
  userProfileId: string,
  event: string,
  data: unknown
): Promise<void> => {
  const userConnections = connections.get(userProfileId);
  
  if (!userConnections || userConnections.size === 0) {
    return;
  }

  const eventData = JSON.stringify(data);
  const message = `event: ${event}\ndata: ${eventData}\n\n`;

  let sentCount = 0;
  const deadConnections: Response[] = [];

  userConnections.forEach((res) => {
    try {
      if (!res.destroyed) {
        res.write(message);
        // Flush immediately to prevent buffering delays
        if (typeof (res as any).flush === "function") {
          (res as any).flush();
        }
        sentCount++;
      } else {
        deadConnections.push(res);
      }
    } catch (error) {
      console.error(`Error sending SSE event to user ${userProfileId}:`, error);
      deadConnections.push(res);
    }
  });

  deadConnections.forEach((res) => {
    removeConnection(userProfileId, res);
  });
};

export const broadcastToConversation = async (
  conversationId: string,
  event: string,
  data: unknown
): Promise<void> => {
  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userProfileId: true },
    });

    if (participants.length === 0) {
      return;
    }

    const broadcastPromises = participants.map((participant) =>
      broadcastToUser(participant.userProfileId, event, data)
    );

    await Promise.all(broadcastPromises);
  } catch (error) {
    console.error(
      `Error broadcasting to conversation ${conversationId}:`,
      error
    );
  }
};

export const getConnectionCount = (userProfileId: string): number => {
  return connections.get(userProfileId)?.size || 0;
};

export const getTotalConnections = (): number => {
  let total = 0;
  connections.forEach((userConnections) => {
    total += userConnections.size;
  });
  return total;
};

export const isSSEInitialized = (): boolean => {
  return connections.size > 0;
};

