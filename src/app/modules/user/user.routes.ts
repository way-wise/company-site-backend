import express, { NextFunction, Request, Response } from "express";
import { fileUploader } from "../../../helpers/fileUploader";
import permissionGuard from "../../middlewares/permissionGuard";
import { userController } from "./user.controller";
import { userValidationSchema } from "./user.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/user/all-users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     description: Retrieve a paginated list of all users with filtering and sorting options. Requires 'read_user' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Missing required permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/all-users",
  permissionGuard("read_user"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      return userController.getAllUsers(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/user/by-role/{roleId}:
 *   get:
 *     tags: [Users]
 *     summary: Get users by role
 *     description: Retrieve all users with a specific role. Requires 'read_user' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 */
router.get(
  "/by-role/:roleId",
  permissionGuard("read_user"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      return userController.getUsersByRole(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/user/create-admin-with-file:
 *   post:
 *     tags: [Users]
 *     summary: Create admin with file upload
 *     description: Create a new admin user with profile picture. Requires 'create_user' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file
 *               data:
 *                 type: string
 *                 format: json
 *                 description: JSON string containing user data (email, password, name, etc.)
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Bad request - Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 */
router.post(
  "/create-admin-with-file",
  permissionGuard("create_user"),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidationSchema.createAdminSchema.parse(
      JSON.parse(req.body.data)
    );

    return userController.createAdmin(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/user/create-admin:
 *   post:
 *     tags: [Users]
 *     summary: Create admin
 *     description: Create a new admin user without file upload. Requires 'create_user' permission.
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
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/create-admin",
  permissionGuard("create_user"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = userValidationSchema.createAdminSchema.parse(req.body);
      return userController.createAdmin(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/user/create-client-with-file:
 *   post:
 *     tags: [Users]
 *     summary: Create client with file upload
 *     description: Create a new client user with profile picture. Requires 'create_user' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               data:
 *                 type: string
 *                 format: json
 *     responses:
 *       201:
 *         description: Client created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/create-client-with-file",
  permissionGuard("create_user"),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = userValidationSchema.createClientSchema.parse(
        JSON.parse(req.body.data)
      );
      return userController.createClient(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/user/create-client:
 *   post:
 *     tags: [Users]
 *     summary: Create client
 *     description: Create a new client user. Requires 'create_user' permission.
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
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/create-client",
  permissionGuard("create_user"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = userValidationSchema.createClientSchema.parse(req.body);
      return userController.createClient(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/user/create-employee-with-file:
 *   post:
 *     tags: [Users]
 *     summary: Create employee with file upload
 *     description: Create a new employee user with profile picture. Requires 'create_user' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               data:
 *                 type: string
 *                 format: json
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/create-employee-with-file",
  permissionGuard("create_user"),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = userValidationSchema.createEmployeeSchema.parse(
        JSON.parse(req.body.data)
      );
      return userController.createEmployee(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/user/create-employee:
 *   post:
 *     tags: [Users]
 *     summary: Create employee
 *     description: Create a new employee user. Requires 'create_user' permission.
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
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/create-employee",
  permissionGuard("create_user"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = userValidationSchema.createEmployeeSchema.parse(req.body);
      return userController.createEmployee(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/user/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     description: Update user information. Requires 'update_user' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *   get:
 *     tags: [Users]
 *     summary: Get single user
 *     description: Retrieve a single user by ID. Requires 'read_user' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     description: Delete a user by ID. Requires 'delete_user' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put("/:id", permissionGuard("update_user"), userController.updateUser);

/**
 * @swagger
 * /api/v1/user/{id}/ban:
 *   post:
 *     tags: [Users]
 *     summary: Ban user
 *     description: Ban a user by ID. Requires 'ban_user' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               banReason:
 *                 type: string
 *                 description: Reason for banning the user
 *     responses:
 *       200:
 *         description: User banned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.post("/:id/ban", permissionGuard("ban_user"), userController.banUser);

/**
 * @swagger
 * /api/v1/user/{id}/unban:
 *   post:
 *     tags: [Users]
 *     summary: Unban user
 *     description: Unban a user by ID. Requires 'ban_user' permission.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User unbanned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.post(
  "/:id/unban",
  permissionGuard("ban_user"),
  userController.unbanUser
);

router.delete(
  "/:id",
  permissionGuard("delete_user"),
  userController.deleteUser
);

// Get single user route (must be last to avoid conflicts)
router.get("/:id", permissionGuard("read_user"), userController.getSingleUser);

export const userRoutes = router;
