import { Server as HTTPServer } from "http";
import { Secret } from "jsonwebtoken";
import { Socket, Server as SocketIOServer } from "socket.io";
import config from "../config/config";
import { jwtHelpers } from "../helpers/jwtHelper";
import prisma from "../shared/prismaClient";
import { registerChatHandlers } from "./chatHandler";

let io: SocketIOServer;

// Interface for authenticated socket
export interface AuthenticatedSocket extends Socket {
  userId: string;
  userProfileId: string;
  email: string;
}

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        "https://www.waywisetech.com",
        "https://waywisetech.com",
        "https://company-site-frontend.vercel.app",
        "http://localhost:3000",
        "http://192.168.1.37:3000",
      ],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Socket authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      // Get token from handshake auth or cookies
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.cookie
          ?.split("accessToken=")[1]
          ?.split(";")[0];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT token
      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { email: verifiedUser.email },
        include: {
          userProfile: true,
        },
      });

      if (!user || !user.userProfile) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user info to socket
      (socket as AuthenticatedSocket).userId = user.id;
      (socket as AuthenticatedSocket).userProfileId = user.userProfile.id;
      (socket as AuthenticatedSocket).email = user.email;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  // Connection handler
  io.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(
      `✅ User connected: ${authSocket.email} (${authSocket.userId})`
    );

    // Register chat event handlers
    registerChatHandlers(io, authSocket);

    // Disconnection handler
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${authSocket.email}`);
    });
  });

  return io;
};

// Export function to get io instance
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
