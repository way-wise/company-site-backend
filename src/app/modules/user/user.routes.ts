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
  "/create-admin-with-file",
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
  "/create-admin",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = userValidationSchema.createAdminSchema.parse(req.body);
      return userController.createAdmin(req, res, next);
    } catch (error) {
      next(error);
    }
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

// Route for employee creation with file upload
router.post(
  "/create-employee-with-file",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = userValidationSchema.createEmployeeSchema.parse(
        JSON.parse(req.body.data)
      );
      return userController.createEmployee(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Route for employee creation without file upload
router.post(
  "/create-employee",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = userValidationSchema.createEmployeeSchema.parse(req.body);
      return userController.createEmployee(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Update user route
router.put("/:id", userController.updateUser);

// Ban user route
router.post("/:id/ban", userController.banUser);

// Unban user route
router.post("/:id/unban", userController.unbanUser);

// Delete user route
router.delete("/:id", userController.deleteUser);

// Get single user route (must be last to avoid conflicts)
router.get("/:id", userController.getSingleUser);

export const userRoutes = router;
