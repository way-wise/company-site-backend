import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.dir("Came to global error handler");
  console.log(err.name);

  // Use the error's statusCode if it exists, otherwise default to 500
  const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    error: err,
  });
};

export default globalErrorHandler;
