import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { ServiceController } from "./service.controller";
import { serviceValidationSchemas } from "./service.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/service:
 *   post:
 *     tags: [Services]
 *     summary: Create a new service
 *     description: Create a new service. Requires 'create_service' permission.
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
 *         description: Service created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Services]
 *     summary: Get all services
 *     description: Retrieve all services. Requires 'read_service' permission.
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
 *         description: Services fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  permissionGuard("create_service"),
  validateRequest(serviceValidationSchemas.create),
  ServiceController.createService
);

router.get(
  "/",
  permissionGuard("read_service"),
  ServiceController.getAllService
);

/**
 * @swagger
 * /api/v1/service/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Get single service
 *     description: Retrieve a single service by ID. Requires 'read_service' permission.
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
 *         description: Service fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Service not found
 *   put:
 *     tags: [Services]
 *     summary: Update service
 *     description: Update a service. Requires 'update_service' permission.
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
 *         description: Service updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Service not found
 *   delete:
 *     tags: [Services]
 *     summary: Delete service
 *     description: Delete a service. Requires 'delete_service' permission.
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
 *         description: Service deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Service not found
 */
router.get(
  "/:id",
  permissionGuard("read_service"),
  ServiceController.getSingleService
);

router.put(
  "/:id",
  permissionGuard("update_service"),
  validateRequest(serviceValidationSchemas.update),
  ServiceController.updateService
);

router.delete(
  "/:id",
  permissionGuard("delete_service"),
  ServiceController.deleteService
);

export const ServiceRoutes = router;
