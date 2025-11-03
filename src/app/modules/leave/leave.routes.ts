import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { LeaveController } from "./leave.controller";
import { leaveValidation } from "./leave.validationSchema";

const router = express.Router();

// Employee routes
router.post(
  "/apply",
  permissionGuard("create_leave"),
  validateRequest(leaveValidation.createLeaveApplicationSchema),
  LeaveController.applyForLeave
);

router.get("/mine", permissionGuard("read_leave"), LeaveController.getMyLeaves);

router.delete(
  "/:id",
  permissionGuard("delete_leave"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.deleteLeave
);

// Cancel leave route - requires update_leave permission (admin can cancel any approved leave)
router.patch(
  "/:id/cancel",
  permissionGuard("update_leave"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.cancelLeave
);

// Admin routes
router.get(
  "/all",
  permissionGuard("view_team_leaves"), // Admin permission to view all leaves
  LeaveController.getAllLeaves
);

router.get(
  "/stats",
  permissionGuard("view_team_leaves"), // Admin permission to view stats
  LeaveController.getLeaveStats
);

router.get(
  "/calendar",
  permissionGuard("view_team_leaves"), // Admin permission to view calendar
  LeaveController.getLeaveCalendar
);

router.get(
  "/:id",
  permissionGuard("read_leave", "view_team_leaves"), // Allow both own leaves and admin view
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.getSingleLeave
);

router.patch(
  "/:id/approve",
  permissionGuard("approve_leave"),
  validateRequest(leaveValidation.leaveParamsSchema),
  validateRequest(leaveValidation.updateLeaveStatusSchema),
  LeaveController.approveLeave
);

router.patch(
  "/:id/reject",
  permissionGuard("approve_leave"),
  validateRequest(leaveValidation.leaveParamsSchema),
  validateRequest(leaveValidation.updateLeaveStatusSchema),
  LeaveController.rejectLeave
);

export const leaveRoutes = router;
