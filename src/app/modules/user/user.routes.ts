import express, { NextFunction, Request, Response } from "express";
import { fileUploader } from "../../../helpers/fileUploader";
import { userController } from "./user.controller";
import { userValidationSchema } from "./user.validationSchema";

const router = express.Router();

router.get("/all-users", (req: Request, res: Response, next: NextFunction) => {
  try {
    return userController.getAllUsers(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/create-admin",
  // authGuard(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidationSchema.createAdminSchema.parse(
      JSON.parse(req.body.data)
    );

    return userController.createAdmin(req, res, next);
  }
);
// Route for client creation with file upload
router.post(
  "/create-client-with-file",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = userValidationSchema.createClientSchema.parse(
        JSON.parse(req.body.data)
      );
      return userController.createClient(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Route for client creation without file upload
router.post(
  "/create-client",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = userValidationSchema.createClientSchema.parse(req.body);
      return userController.createClient(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export const userRoutes = router;
