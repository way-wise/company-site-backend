import express from "express";
import authGuard from "../../middlewares/authGuard";
import { authController } from "./auth.controller";
const router = express.Router();

router.post("/login", authController.loginUser);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post("/change-password", authGuard(), authController.changePassword);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.get("/me", authGuard(), authController.getMe);

export const authRoutes = router;
