import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import { adminValidationSchemas } from "./admin.ValidationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/admin:
 *   get:
 *     tags: [Admin]
 *     summary: Get all admins
 *     description: Retrieve all admin users. Requires 'read_user' permission.
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
 *         description: Admins fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", permissionGuard("read_user"), AdminController.getAllAdmin);

/**
 * @swagger
 * /api/v1/admin/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get single admin
 *     description: Retrieve a single admin by ID. Requires 'read_user' permission.
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
 *         description: Admin fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 *   patch:
 *     tags: [Admin]
 *     summary: Update admin
 *     description: Update admin information. Requires 'update_user' permission.
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
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 *   delete:
 *     tags: [Admin]
 *     summary: Delete admin (hard delete)
 *     description: Permanently delete an admin. Requires 'delete_user' permission.
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
 *         description: Admin deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 */
router.get(
  "/:id",
  permissionGuard("read_user"),
  AdminController.getSingleAdmin
);

router.patch(
  "/:id",
  permissionGuard("update_user"),
  validateRequest(adminValidationSchemas.update),
  AdminController.updateAdmin
);

router.delete(
  "/:id",
  permissionGuard("delete_user"),
  AdminController.deleteAdmin
);

/**
 * @swagger
 * /api/v1/admin/soft/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Soft delete admin
 *     description: Soft delete an admin (marks as deleted but doesn't remove from database). Requires 'delete_user' permission.
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
 *         description: Admin soft deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 */
router.delete(
  "/soft/:id",
  permissionGuard("delete_user"),
  AdminController.softDeleteAdmin
);

export const AdminRoutes = router;
