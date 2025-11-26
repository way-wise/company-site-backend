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

app.use(
  cors({
    origin: [
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
    ],
    credentials: true,
  })
);
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
