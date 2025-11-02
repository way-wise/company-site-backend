import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { LeaveTypeController } from "./leaveType.controller";
import { leaveTypeValidation } from "./leaveType.validationSchema";

const router = express.Router();

router.get("/active", LeaveTypeController.getActiveLeaveTypes);

router.get("/", LeaveTypeController.getAllLeaveTypes);

router.get(
  "/:id",
  validateRequest(leaveTypeValidation.leaveTypeParamsSchema),
  LeaveTypeController.getSingleLeaveType
);

router.post(
  "/",
  permissionGuard("manage_leave_types"),
  validateRequest(leaveTypeValidation.createLeaveTypeSchema),
  LeaveTypeController.createLeaveType
);

router.patch(
  "/:id",
  permissionGuard("manage_leave_types"),
  validateRequest(leaveTypeValidation.leaveTypeParamsSchema),
  validateRequest(leaveTypeValidation.updateLeaveTypeSchema),
  LeaveTypeController.updateLeaveType
);

router.delete(
  "/:id",
  permissionGuard("manage_leave_types"),
  validateRequest(leaveTypeValidation.leaveTypeParamsSchema),
  LeaveTypeController.deleteLeaveType
);

router.patch(
  "/:id/toggle-status",
  permissionGuard("manage_leave_types"),
  validateRequest(leaveTypeValidation.leaveTypeParamsSchema),
  LeaveTypeController.toggleLeaveTypeStatus
);

export const leaveTypeRoutes = router;

