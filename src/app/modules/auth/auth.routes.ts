import { UserRole } from "@prisma/client";
import express from "express";
import authGuard from "../../middlewares/authGuard";
import { authController } from "./auth.controller";
const router = express.Router();

router.post("/login", authController.loginUser);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/change-password",
  authGuard(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.CLIENT,
    UserRole.EMPLOYEE
  ),
  authController.changePassword
);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export const authRoutes = router;
