import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { LeaveBalanceController } from "./leaveBalance.controller";
import { leaveBalanceValidation } from "./leaveBalance.validationSchema";

const router = express.Router();

router.get(
  "/",
  permissionGuard("read_leave", "manage_leave_balance"),
  LeaveBalanceController.getAllLeaveBalances
);

router.get(
  "/summary",
  permissionGuard("read_leave", "view_team_leaves", "approve_leave"),
  LeaveBalanceController.getEmployeesLeaveSummary
);

router.get(
  "/user/:id",
  permissionGuard("read_leave"),
  validateRequest(leaveBalanceValidation.leaveBalanceParamsSchema),
  LeaveBalanceController.getUserLeaveBalances
);

router.get(
  "/:id",
  permissionGuard("read_leave"),
  validateRequest(leaveBalanceValidation.leaveBalanceParamsSchema),
  LeaveBalanceController.getSingleLeaveBalance
);

router.post(
  "/",
  permissionGuard("manage_leave_balance"),
  validateRequest(leaveBalanceValidation.createLeaveBalanceSchema),
  LeaveBalanceController.createLeaveBalance
);

router.patch(
  "/:id",
  permissionGuard("manage_leave_balance"),
  validateRequest(leaveBalanceValidation.leaveBalanceParamsSchema),
  validateRequest(leaveBalanceValidation.updateLeaveBalanceSchema),
  LeaveBalanceController.updateLeaveBalance
);

router.delete(
  "/:id",
  permissionGuard("manage_leave_balance"),
  validateRequest(leaveBalanceValidation.leaveBalanceParamsSchema),
  LeaveBalanceController.deleteLeaveBalance
);

router.post(
  "/allocate/:id",
  permissionGuard("manage_leave_balance"),
  validateRequest(leaveBalanceValidation.leaveBalanceParamsSchema),
  validateRequest(leaveBalanceValidation.allocateBalanceSchema),
  LeaveBalanceController.allocateAnnualBalance
);

router.post(
  "/allocate-all",
  permissionGuard("manage_leave_balance"),
  validateRequest(leaveBalanceValidation.allocateYearlyLeaveForAllSchema),
  LeaveBalanceController.allocateYearlyLeaveForAll
);

export const leaveBalanceRoutes = router;
