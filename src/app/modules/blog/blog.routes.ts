import express from "express";
import permissionGuard from "../../middlewares/permissionGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { BlogController } from "./blog.controller";
import { blogValidationSchemas } from "./blog.validationSchema";

const router = express.Router();

// Public routes (no authentication required)
router.get("/public", BlogController.getPublicBlogs);
router.get("/slug/:slug", BlogController.getBlogBySlug);

// Protected routes
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

router.get(
  "/stats",
  permissionGuard("read_blog", "view_all_blogs"),
  BlogController.getBlogStats
);

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

