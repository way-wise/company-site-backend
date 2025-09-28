import express, { NextFunction, Request, Response } from "express";
import { fileUploader } from "../../../helpers/fileUploader";
import { userController } from "./user.controller";
import { userValidationSchema } from "./user.validationSchema";

const router = express.Router();

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
router.post(
  "/create-client",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidationSchema.createClientSchema.parse(
      JSON.parse(req.body.data)
    );

    return userController.createClient(req, res, next);
  }
);

export const userRoutes = router;
