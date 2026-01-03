import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { LeaveBalanceController } from "./leaveBalance.controller";
import { leaveBalanceValidation } from "./leaveBalance.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/leave-balance:
 *   get:
 *     tags: [Leave Balance]
 *     summary: Get all leave balances
 *     description: Retrieve all leave balances. Requires 'read_leave' or 'manage_leave_balance' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave balances fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   post:
 *     tags: [Leave Balance]
 *     summary: Create leave balance
 *     description: Create a new leave balance. Requires 'manage_leave_balance' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userProfileId
 *               - year
 *               - leaveType
 *             properties:
 *               userProfileId:
 *                 type: string
 *               year:
 *                 type: integer
 *               leaveType:
 *                 type: string
 *                 enum: [CASUAL, SICK, EMERGENCY]
 *               totalDays:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Leave balance created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  permissionGuard("read_leave", "manage_leave_balance"),
  LeaveBalanceController.getAllLeaveBalances
);

/**
 * @swagger
 * /api/v1/leave-balance/summary:
 *   get:
 *     tags: [Leave Balance]
 *     summary: Get employees leave summary
 *     description: Get leave summary for all employees. Requires 'read_leave', 'view_team_leaves', or 'approve_leave' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Summary fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/leave-balance/user/{id}:
 *   get:
 *     tags: [Leave Balance]
 *     summary: Get user leave balances
 *     description: Get all leave balances for a specific user. Requires 'read_leave' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave balances fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /api/v1/leave-balance/{id}:
 *   get:
 *     tags: [Leave Balance]
 *     summary: Get single leave balance
 *     description: Get a single leave balance by ID. Requires 'read_leave' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave balance fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Leave balance not found
 *   patch:
 *     tags: [Leave Balance]
 *     summary: Update leave balance
 *     description: Update a leave balance. Requires 'manage_leave_balance' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalDays:
 *                 type: integer
 *               usedDays:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Leave balance updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Leave balance not found
 *   delete:
 *     tags: [Leave Balance]
 *     summary: Delete leave balance
 *     description: Delete a leave balance. Requires 'manage_leave_balance' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave balance deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Leave balance not found
 * /api/v1/leave-balance/allocate/{id}:
 *   post:
 *     tags: [Leave Balance]
 *     summary: Allocate annual balance
 *     description: Allocate annual leave balance to a user. Requires 'manage_leave_balance' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalDays:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Balance allocated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/leave-balance/allocate-all:
 *   post:
 *     tags: [Leave Balance]
 *     summary: Allocate yearly leave for all
 *     description: Allocate yearly leave balance for all employees. Requires 'manage_leave_balance' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *             properties:
 *               year:
 *                 type: integer
 *               totalDays:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Leave allocated for all employees successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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
