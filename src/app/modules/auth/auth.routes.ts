import express from "express";
import authGuard from "../../middlewares/authGuard";
import { authController } from "./auth.controller";

const router = express.Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authGuard(), authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.get("/me", authGuard(), authController.getMe);

export const authRoutes = router;
