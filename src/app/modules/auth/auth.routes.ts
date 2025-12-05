import express from "express";
import authGuard from "../../middlewares/authGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { authController } from "./auth.controller";
import { authValidationSchemas } from "./auth.validationSchema";

const router = express.Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authGuard(), authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.get("/me", authGuard(), authController.getMe);

// Password management routes
router.post(
  "/forgot-password",
  validateRequest(authValidationSchemas.forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validateRequest(authValidationSchemas.resetPasswordSchema),
  authController.resetPassword
);
router.post(
  "/change-password",
  authGuard(),
  validateRequest(authValidationSchemas.changePasswordSchema),
  authController.changePassword
);

export const authRoutes = router;
