import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

export const validateRequest = (schema: ZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req);
      next();
    } catch (error) {
      next(error);
    }
  };
};
