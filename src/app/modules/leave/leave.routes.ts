import express from "express";
import authGuard from "../../middlewares/authGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { LeaveController } from "./leave.controller";
import { leaveValidation } from "./leave.validationSchema";

const router = express.Router();

// Employee routes
router.post(
  "/apply",
  authGuard("EMPLOYEE"),
  validateRequest(leaveValidation.createLeaveApplicationSchema),
  LeaveController.applyForLeave
);

router.get("/mine", authGuard("EMPLOYEE"), LeaveController.getMyLeaves);

router.delete(
  "/:id",
  authGuard("EMPLOYEE"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.deleteLeave
);

// Admin routes
router.get(
  "/all",
  authGuard("ADMIN", "SUPER_ADMIN"),
  LeaveController.getAllLeaves
);

router.get(
  "/:id",
  authGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.getSingleLeave
);

router.patch(
  "/:id/approve",
  authGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.approveLeave
);

router.patch(
  "/:id/reject",
  authGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.rejectLeave
);

export const leaveRoutes = router;
