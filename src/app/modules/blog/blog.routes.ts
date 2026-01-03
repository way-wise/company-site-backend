import express from "express";
import { fileUploader } from "../../../helpers/fileUploader";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { BlogController } from "./blog.controller";
import { blogValidationSchemas } from "./blog.validationSchema";

const router = express.Router();

/**
 * @swagger
 * /api/v1/blogs/public:
 *   get:
 *     tags: [Blogs]
 *     summary: Get public blogs
 *     description: Retrieve all published blogs (public endpoint, no authentication required)
 *     responses:
 *       200:
 *         description: Public blogs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/public", BlogController.getPublicBlogs);

/**
 * @swagger
 * /api/v1/blogs/slug/{slug}:
 *   get:
 *     tags: [Blogs]
 *     summary: Get blog by slug
 *     description: Retrieve a blog post by its slug (public endpoint)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog slug
 *     responses:
 *       200:
 *         description: Blog fetched successfully
 *       404:
 *         description: Blog not found
 */
router.get("/slug/:slug", BlogController.getBlogBySlug);

/**
 * @swagger
 * /api/v1/blogs/upload-image:
 *   post:
 *     tags: [Blogs]
 *     summary: Upload blog image
 *     description: Upload an image for blog post. Requires 'create_blog' permission.
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
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/upload-image",
  permissionGuard("create_blog"),
  fileUploader.upload.single("image"),
  BlogController.uploadImage
);

/**
 * @swagger
 * /api/v1/blogs:
 *   post:
 *     tags: [Blogs]
 *     summary: Create blog
 *     description: Create a new blog post. Requires 'create_blog' permission.
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
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               slug:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Blog created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Blogs]
 *     summary: Get all blogs
 *     description: Retrieve all blogs with pagination. Requires 'read_blog' or 'view_all_blogs' permission.
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
 *         description: Blogs fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/",
  permissionGuard("create_blog"),
  validateRequest(blogValidationSchemas.create),
  BlogController.createBlog
);

router.get(
  "/",
  permissionGuard("read_blog", "view_all_blogs"),
  BlogController.getAllBlogs
);

/**
 * @swagger
 * /api/v1/blogs/stats:
 *   get:
 *     tags: [Blogs]
 *     summary: Get blog statistics
 *     description: Get blog statistics. Requires 'read_blog' or 'view_all_blogs' permission.
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
 */
router.get(
  "/stats",
  permissionGuard("read_blog", "view_all_blogs"),
  BlogController.getBlogStats
);

/**
 * @swagger
 * /api/v1/blogs/{id}:
 *   get:
 *     tags: [Blogs]
 *     summary: Get single blog
 *     description: Retrieve a blog by ID. Requires 'read_blog' or 'view_all_blogs' permission.
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
 *         description: Blog fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Blog not found
 *   put:
 *     tags: [Blogs]
 *     summary: Update blog
 *     description: Update a blog post. Requires 'update_blog' or 'update_all_blogs' permission.
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Blog not found
 *   delete:
 *     tags: [Blogs]
 *     summary: Delete blog
 *     description: Delete a blog post. Requires 'delete_blog' or 'delete_all_blogs' permission.
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
 *         description: Blog deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Blog not found
 */
router.get(
  "/:id",
  permissionGuard("read_blog", "view_all_blogs"),
  BlogController.getSingleBlog
);

router.put(
  "/:id",
  permissionGuard("update_blog", "update_all_blogs"),
  validateRequest(blogValidationSchemas.update),
  BlogController.updateBlog
);

router.delete(
  "/:id",
  permissionGuard("delete_blog", "delete_all_blogs"),
  BlogController.deleteBlog
);

export const BlogRoutes = router;

