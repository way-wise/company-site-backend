import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";

const app: Application = express();

// Lightweight health endpoint (no auth, no heavy deps)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send("ok");
});

// CORS Configuration
const allowedOrigins = [
  // Main domain
  "https://www.waywisetech.com",
  "https://waywisetech.com",
  // Dashboard subdomain
  "https://dashboard.waywisetech.com",
  // Vercel deployments
  "https://company-site-frontend.vercel.app",
  // Local development
  "http://localhost:3000",
  "http://192.168.1.30:3000",
  "http://192.168.1.46:3000",
  "http://localhost:3001",
  "https://localhost:3000",
  "https://localhost:3001",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400, // 24 hours
  })
);

// CORS Debug Middleware - Logs CORS-related information
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  console.log(
    `[CORS] ${req.method} ${req.path} from origin: ${origin || "none"}`
  );

  if (origin && allowedOrigins.includes(origin)) {
    console.log(`[CORS] ✓ Origin allowed: ${origin}`);
  } else if (origin) {
    console.log(`[CORS] ✗ Origin not allowed: ${origin}`);
  }

  // Log response headers after they're set
  const originalSend = res.send;
  res.send = function (data) {
    console.log(`[CORS] Response headers:`, {
      "access-control-allow-origin": res.getHeader(
        "access-control-allow-origin"
      ),
      "access-control-allow-credentials": res.getHeader(
        "access-control-allow-credentials"
      ),
    });
    return originalSend.call(this, data);
  };

  next();
});

app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", router);

app.use(globalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "Oops! It looks like this page doesn't exist.",
    error: {
      path: req.originalUrl,
      error: `The requested URL was not found on this server.`,
      suggestion: "Double-check the URL",
    },
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World with some bug!");
});

export default app;
