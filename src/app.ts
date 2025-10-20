import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";

const app: Application = express();

app.use(
  cors({
    origin: [
      "https://www.waywisetech.com",
      "https://waywisetech.com",
      "https://company-site-frontend.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://192.168.1.37:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
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
