import express from "express";
import { SSEController } from "./sse.controller";

const router = express.Router();

// SSE endpoint - no authGuard middleware needed, authentication is handled in controller
router.get("/events", SSEController.connectSSE);

export const SSERoutes = router;

