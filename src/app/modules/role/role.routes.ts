import express, { NextFunction, Request, Response } from "express";
import authGuard from "../../middlewares/authGuard";
import permissionGuard from "../../middlewares/permissionGuard";
import { roleController } from "./role.controller";
import { roleValidationSchema } from "./role.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/roles/user/{userId}/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Get user roles
 *     description: Get all roles assigned to a user. Requires 'read_role' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User roles fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/user/:userId/roles",
  permissionGuard("read_role"),
  roleController.getUserRoles
);

/**
 * @swagger
 * /api/v1/roles/user/{userId}/permissions:
 *   get:
 *     tags: [Roles]
 *     summary: Get user permissions
 *     description: Get all permissions for a user (authenticated users can check their own permissions)
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User permissions fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/user/:userId/permissions",
  authGuard(),
  roleController.getUserPermissions
);

/**
 * @swagger
 * /api/v1/roles/assign-user:
 *   post:
 *     tags: [Roles]
 *     summary: Assign role to user
 *     description: Assign a role to a user. Requires 'assign_role' permission.
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
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/assign-user",
  permissionGuard("assign_role"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.assignRoleToUserSchema.parse(req.body);
      return roleController.assignRoleToUser(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/roles/remove-user:
 *   post:
 *     tags: [Roles]
 *     summary: Remove role from user
 *     description: Remove a role from a user. Requires 'assign_role' permission.
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
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role removed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/remove-user",
  permissionGuard("assign_role"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.removeRoleFromUserSchema.parse(req.body);
      return roleController.removeRoleFromUser(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Get all roles
 *     description: Retrieve all roles. Requires 'read_role' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Roles fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   post:
 *     tags: [Roles]
 *     summary: Create role
 *     description: Create a new role. Requires 'create_role' permission.
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  permissionGuard("read_role"),
  roleController.getAllRoles
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get single role
 *     description: Retrieve a single role by ID. Requires 'read_role' permission.
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
 *         description: Role fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 *   put:
 *     tags: [Roles]
 *     summary: Update role
 *     description: Update a role. Requires 'update_role' permission.
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 *   delete:
 *     tags: [Roles]
 *     summary: Delete role
 *     description: Delete a role. Requires 'delete_role' permission.
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
 *         description: Role deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.get(
  "/:id",
  permissionGuard("read_role"),
  roleController.getSingleRole
);

router.post(
  "/",
  permissionGuard("create_role"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.createRoleSchema.parse(req.body);
      return roleController.createRole(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  permissionGuard("update_role"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.updateRoleSchema.parse(req.body);
      return roleController.updateRole(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  permissionGuard("delete_role"),
  roleController.deleteRole
);

/**
 * @swagger
 * /api/v1/roles/{id}/permissions:
 *   post:
 *     tags: [Roles]
 *     summary: Assign permissions to role
 *     description: Assign one or more permissions to a role. Requires 'update_role' permission.
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
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * /api/v1/roles/{roleId}/permissions/{permissionId}:
 *   delete:
 *     tags: [Roles]
 *     summary: Remove permission from role
 *     description: Remove a permission from a role. Requires 'update_role' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/:id/permissions",
  permissionGuard("update_role"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = roleValidationSchema.assignPermissionsSchema.parse(req.body);
      return roleController.assignPermissionsToRole(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:roleId/permissions/:permissionId",
  permissionGuard("update_role"),
  roleController.removePermissionFromRole
);

export const roleRoutes = router;
