import express, { NextFunction, Request, Response } from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { permissionController } from "./permission.controller";
import { permissionValidationSchema } from "./permission.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/permissions/groups:
 *   get:
 *     tags: [Permissions]
 *     summary: Get permission groups
 *     description: Get all permission groups. Requires 'read_permission' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Permission groups fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/groups",
  permissionGuard("read_permission"),
  permissionController.getPermissionGroups
);

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: Get all permissions
 *     description: Retrieve all permissions. Requires 'read_permission' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Permissions fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   post:
 *     tags: [Permissions]
 *     summary: Create permission
 *     description: Create a new permission. Requires 'create_permission' permission.
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
 *               - group
 *             properties:
 *               name:
 *                 type: string
 *               group:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  permissionGuard("read_permission"),
  permissionController.getAllPermissions
);

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   get:
 *     tags: [Permissions]
 *     summary: Get single permission
 *     description: Retrieve a single permission by ID. Requires 'read_permission' permission.
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
 *         description: Permission fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Permission not found
 *   put:
 *     tags: [Permissions]
 *     summary: Update permission
 *     description: Update a permission. Requires 'update_permission' permission.
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
 *               group:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Permission not found
 *   delete:
 *     tags: [Permissions]
 *     summary: Delete permission
 *     description: Delete a permission. Requires 'delete_permission' permission.
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
 *         description: Permission deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Permission not found
 */
router.get(
  "/:id",
  permissionGuard("read_permission"),
  permissionController.getSinglePermission
);

router.post(
  "/",
  permissionGuard("create_permission"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = permissionValidationSchema.createPermissionSchema.parse(
        req.body
      );
      return permissionController.createPermission(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  permissionGuard("update_permission"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = permissionValidationSchema.updatePermissionSchema.parse(
        req.body
      );
      return permissionController.updatePermission(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  permissionGuard("delete_permission"),
  permissionController.deletePermission
);

export const permissionRoutes = router;
