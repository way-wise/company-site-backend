import { NextFunction, Request, Response } from "express";
import { verifyAndFetchUser } from "../../../helpers/authHelper";
import { addConnection } from "../../../sse";

export const connectSSE = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await verifyAndFetchUser(req, res);
    
    if (!user || !user.userProfile) {
      if (!res.headersSent) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Authentication required" })}\n\n`);
      res.end();
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    
    // Flush headers immediately to prevent buffering
    if (typeof (res as any).flushHeaders === "function") {
      (res as any).flushHeaders();
    }
    
    const userProfileId = user.userProfile.id;

    res.write(`event: connected\ndata: ${JSON.stringify({ userProfileId })}\n\n`);
    
    // Flush the initial connection message
    if (typeof (res as any).flush === "function") {
      (res as any).flush();
    }

    addConnection(userProfileId, res);
  } catch (error) {
    if (!res.headersSent) {
      return res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : "Authentication failed",
      });
    }
    
    res.write(`event: error\ndata: ${JSON.stringify({ 
      message: error instanceof Error ? error.message : "Authentication failed" 
    })}\n\n`);
    res.end();
  }
};

export const SSEController = {
  connectSSE,
};

