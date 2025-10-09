import express from "express";
import roleGuard from "../../middlewares/roleGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { LeaveController } from "./leave.controller";
import { leaveValidation } from "./leave.validationSchema";

const router = express.Router();

// Employee routes
router.post(
  "/apply",
  roleGuard("EMPLOYEE"),
  validateRequest(leaveValidation.createLeaveApplicationSchema),
  LeaveController.applyForLeave
);

router.get("/mine", roleGuard("EMPLOYEE"), LeaveController.getMyLeaves);

router.delete(
  "/:id",
  roleGuard("EMPLOYEE"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.deleteLeave
);

// Admin routes
router.get(
  "/all",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  LeaveController.getAllLeaves
);

router.get(
  "/:id",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.getSingleLeave
);

router.patch(
  "/:id/approve",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.approveLeave
);

router.patch(
  "/:id/reject",
  roleGuard("ADMIN", "SUPER_ADMIN"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.rejectLeave
);

export const leaveRoutes = router;
