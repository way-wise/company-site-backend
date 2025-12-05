import { Request, Response } from "express";
import httpStatus from "http-status";
import { uploadFileToBlob } from "../../../helpers/blobUploader";
import { UploadedFile } from "../../interfaces/file";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { validParams } from "./blog.constants";
import { BlogService } from "./blog.service";

const createBlog = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userProfileId =
      req.body.userProfileId || req.user?.userProfile?.id;

    if (!userProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "User profile ID is required",
      });
    }

    const result = await BlogService.createBlogIntoDB({
      ...req.body,
      userProfileId,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Blog created successfully!",
      data: result,
    });
  }
);

const getAllBlogs = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const validQueryParams = filterValidQueryParams(req.query, validParams);
    const paginationAndSortingQueryParams = filterValidQueryParams(
      req.query,
      paginationAndSortingParams
    );

    const result = await BlogService.getAllBlogsFromDB(
      validQueryParams,
      paginationAndSortingQueryParams,
      req.user
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blogs fetched successfully!",
      data: result.data,
      meta: result.meta,
    });
  }
);

const getPublicBlogs = catchAsync(async (req: Request, res: Response) => {
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await BlogService.getPublicBlogsFromDB(
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Public blogs fetched successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getBlogBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const result = await BlogService.getBlogBySlugFromDB(slug);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Blog not found",
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog fetched successfully!",
    data: result,
  });
});

const getSingleBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await BlogService.getSingleBlogFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog fetched successfully!",
    data: result,
  });
});

const updateBlog = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;

    // Check if user has permission to update this blog
    const existingBlog = await BlogService.getSingleBlogFromDB(id);
    const userProfileId = req.user?.userProfile?.id;
    const hasUpdateAllPermission = req.user?.permissions?.includes("update_all_blogs");

    // Permission check: user must either own the blog OR have update_all_blogs permission
    if (!userProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "Authentication required",
      });
    }

    if (
      existingBlog.userProfileId !== userProfileId &&
      !hasUpdateAllPermission
    ) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        success: false,
        message: "You don't have permission to update this blog",
      });
    }

    const result = await BlogService.updateBlogIntoDB(id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog updated successfully!",
      data: result,
    });
  }
);

const deleteBlog = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const { id } = req.params;

    // Check if user has permission to delete this blog
    const existingBlog = await BlogService.getSingleBlogFromDB(id);
    const userProfileId = req.user?.userProfile?.id;
    const hasDeleteAllPermission = req.user?.permissions?.includes("delete_all_blogs");

    // Permission check: user must either own the blog OR have delete_all_blogs permission
    if (!userProfileId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "Authentication required",
      });
    }

    if (
      existingBlog.userProfileId !== userProfileId &&
      !hasDeleteAllPermission
    ) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        success: false,
        message: "You don't have permission to delete this blog",
      });
    }

    const result = await BlogService.deleteBlogFromDB(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog deleted successfully!",
      data: result,
    });
  }
);

const getBlogStats = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userProfileId = req.user?.userProfile?.id;

    const result = await BlogService.getBlogStatsFromDB(userProfileId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog stats fetched successfully!",
      data: result,
    });
  }
);

const uploadImage = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as unknown as UploadedFile;

  if (!file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "No image file provided",
      data: null,
    });
  }

  // Validate file type (images only)
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed",
      data: null,
    });
  }

  try {
    // Upload file to blob storage
    const uploadResult = await uploadFileToBlob(file, {
      prefix: "blogs/images",
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Image uploaded successfully!",
      data: { url: uploadResult.url },
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload image",
      data: null,
    });
  }
});

export const BlogController = {
  createBlog,
  getAllBlogs,
  getPublicBlogs,
  getBlogBySlug,
  getSingleBlog,
  updateBlog,
  deleteBlog,
  getBlogStats,
  uploadImage,
};

