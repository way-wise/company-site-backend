import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { LeaveController } from "./leave.controller";
import { leaveValidation } from "./leave.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/leaves/apply:
 *   post:
 *     tags: [Leaves]
 *     summary: Apply for leave
 *     description: Submit a leave application. Requires 'create_leave' permission.
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
 *               - startDate
 *               - endDate
 *               - reason
 *               - leaveType
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *               leaveType:
 *                 type: string
 *                 enum: [CASUAL, SICK, EMERGENCY]
 *               attachmentUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave application submitted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/apply",
  permissionGuard("create_leave"),
  validateRequest(leaveValidation.createLeaveApplicationSchema),
  LeaveController.applyForLeave
);

/**
 * @swagger
 * /api/v1/leaves/mine:
 *   get:
 *     tags: [Leaves]
 *     summary: Get my leaves
 *     description: Get all leave applications for the authenticated user. Requires 'read_leave' permission.
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
 *         description: Leaves fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/mine", permissionGuard("read_leave"), LeaveController.getMyLeaves);

/**
 * @swagger
 * /api/v1/leaves/all:
 *   get:
 *     tags: [Leaves]
 *     summary: Get all leaves (Admin)
 *     description: Get all leave applications. Requires 'view_team_leaves' or 'approve_leave' permission.
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leaves fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/leaves/stats:
 *   get:
 *     tags: [Leaves]
 *     summary: Get leave statistics
 *     description: Get leave statistics. Requires 'view_team_leaves' or 'approve_leave' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Statistics fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/leaves/calendar:
 *   get:
 *     tags: [Leaves]
 *     summary: Get leave calendar
 *     description: Get leave calendar view. Requires 'view_team_leaves' or 'approve_leave' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Calendar data fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/all",
  permissionGuard("view_team_leaves", "approve_leave"),
  LeaveController.getAllLeaves
);

router.get(
  "/stats",
  permissionGuard("view_team_leaves", "approve_leave"),
  LeaveController.getLeaveStats
);

router.get(
  "/calendar",
  permissionGuard("view_team_leaves", "approve_leave"),
  LeaveController.getLeaveCalendar
);

/**
 * @swagger
 * /api/v1/leaves/{id}:
 *   get:
 *     tags: [Leaves]
 *     summary: Get single leave
 *     description: Get a single leave application by ID. Requires 'read_leave', 'view_team_leaves', or 'approve_leave' permission.
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
 *         description: Leave fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Leave not found
 *   delete:
 *     tags: [Leaves]
 *     summary: Delete leave
 *     description: Delete a leave application. Requires 'delete_leave' permission.
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
 *         description: Leave deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Leave not found
 * /api/v1/leaves/{id}/cancel:
 *   patch:
 *     tags: [Leaves]
 *     summary: Cancel leave
 *     description: Cancel a leave application. Requires 'update_leave' permission.
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
 *         description: Leave cancelled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Leave not found
 * /api/v1/leaves/{id}/approve:
 *   patch:
 *     tags: [Leaves]
 *     summary: Approve leave
 *     description: Approve a leave application. Requires 'approve_leave' permission.
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave approved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Leave not found
 * /api/v1/leaves/{id}/reject:
 *   patch:
 *     tags: [Leaves]
 *     summary: Reject leave
 *     description: Reject a leave application. Requires 'approve_leave' permission.
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
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave rejected successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Leave not found
 */
router.get(
  "/:id",
  permissionGuard("read_leave", "view_team_leaves", "approve_leave"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.getSingleLeave
);

router.delete(
  "/:id",
  permissionGuard("delete_leave"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.deleteLeave
);

router.patch(
  "/:id/cancel",
  permissionGuard("update_leave"),
  validateRequest(leaveValidation.leaveParamsSchema),
  LeaveController.cancelLeave
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
