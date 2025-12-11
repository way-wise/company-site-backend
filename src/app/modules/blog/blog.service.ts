import { Blog, Prisma } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./blog.constants";
import { IBlogFilterParams } from "./blog.interface";

// Helper function to transform blog data for frontend
const transformBlogData = (blog: any) => {
  // Handle tags - Prisma returns JSON as object/array, ensure it's an array
  let tags: string[] = [];
  if (blog.tags) {
    if (Array.isArray(blog.tags)) {
      tags = blog.tags;
    } else if (typeof blog.tags === "string") {
      try {
        tags = JSON.parse(blog.tags);
      } catch {
        tags = [];
      }
    } else {
      tags = [];
    }
  }

  return {
    ...blog,
    status: blog.status || "DRAFT",
    tags,
    publishedAt: blog.publishedAt ? blog.publishedAt.toISOString() : undefined,
    createdAt: blog.createdAt.toISOString(),
    updatedAt: blog.updatedAt.toISOString(),
    author: blog.userProfile?.user
      ? {
          id: blog.userProfile.user.id,
          name: blog.userProfile.user.name,
          email: blog.userProfile.user.email,
        }
      : undefined,
  };
};

// Helper function to generate slug from title
// Matches the migration pattern: REGEXP_REPLACE('[^a-zA-Z0-9]+', '-', 'g')
// This ensures consistency between existing blogs and new blogs
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-") // Replace all non-alphanumeric characters with hyphens (matches migration pattern)
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Helper function to ensure unique slug
const ensureUniqueSlug = async (
  baseSlug: string,
  excludeId?: string
): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.blog.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

const createBlogIntoDB = async (data: {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  userProfileId: string;
}): Promise<Blog> => {
  // Validate that userProfileId exists
  const userProfile = await prisma.userProfile.findUnique({
    where: { id: data.userProfileId },
  });

  if (!userProfile) {
    throw new Error(`UserProfile with id ${data.userProfileId} not found`);
  }

  // Use custom slug if provided, otherwise generate from title
  const baseSlug = data.slug || generateSlug(data.title);
  const slug = await ensureUniqueSlug(baseSlug);

  // Set publishedAt if status is PUBLISHED (handle both uppercase and lowercase)
  const statusUpper = data.status?.toUpperCase();
  const publishedAt = statusUpper === "PUBLISHED" ? new Date() : null;

  const blog = await prisma.blog.create({
    data: {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      featuredImage: data.featuredImage,
      status:
        (data.status?.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED") ||
        "DRAFT",
      tags: data.tags ? (data.tags as unknown as Prisma.JsonArray) : [],
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      slug,
      publishedAt,
      userProfileId: data.userProfileId,
    },
    include: {
      userProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return transformBlogData(blog);
};

const getAllBlogsFromDB = async (
  queryParams: IBlogFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams,
  user?: any
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.BlogWhereInput[] = [];

  //@ searching
  if (q) {
    const searchConditions = searchableFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
    conditions.push({ OR: searchConditions });
  }

  //@ filtering with exact value
  if (Object.keys(otherQueryParams).length > 0) {
    const filterData = Object.keys(otherQueryParams).map((key) => ({
      [key]: (otherQueryParams as any)[key],
    }));
    conditions.push(...filterData);
  }

  //@ permission-based filtering
  if (user) {
    const { permissions, userProfile } = user;
    const canViewAllBlogs = permissions.includes("view_all_blogs");

    if (!canViewAllBlogs) {
      const canViewBlogs = permissions.includes("read_blog");

      if (canViewBlogs && userProfile) {
        // User sees only their own blogs
        conditions.push({ userProfileId: userProfile.id });
      } else {
        // No permission to view blogs - return empty
        conditions.push({ id: "no-access" });
      }
    }
  }

  const result = await prisma.blog.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      userProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.blog.count({
    where: conditions.length > 0 ? { AND: conditions } : {},
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result.map(transformBlogData),
  };
};

const getPublicBlogsFromDB = async (
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const result = await prisma.blog.findMany({
    where: {
      status: "PUBLISHED",
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      userProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.blog.count({
    where: {
      status: "PUBLISHED",
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result.map(transformBlogData),
  };
};

const getBlogBySlugFromDB = async (slug: string) => {
  const blog = await prisma.blog.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      userProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return blog ? transformBlogData(blog) : null;
};

const getSingleBlogFromDB = async (id: string) => {
  const blog = await prisma.blog.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      userProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return transformBlogData(blog);
};

const updateBlogIntoDB = async (
  id: string,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    featuredImage?: string;
    status?: string;
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
  }
): Promise<Blog> => {
  const existingBlog = await prisma.blog.findUniqueOrThrow({
    where: {
      id,
    },
  });

  // Handle slug changes
  let slug = existingBlog.slug;
  if (data.slug !== undefined) {
    // Custom slug provided - use it
    slug = await ensureUniqueSlug(data.slug, id);
  } else if (data.title && data.title !== existingBlog.title) {
    // Title changed but no custom slug - auto-generate
    const baseSlug = generateSlug(data.title);
    slug = await ensureUniqueSlug(baseSlug, id);
  }

  // Handle publishedAt based on status change
  let publishedAt = existingBlog.publishedAt;
  const statusUpper = data.status?.toUpperCase();
  if (statusUpper === "PUBLISHED" && !publishedAt) {
    publishedAt = new Date();
  } else if (statusUpper && statusUpper !== "PUBLISHED" && publishedAt) {
    // Keep publishedAt even if status changes (for history)
    // Or set to null if you want to reset it
    // publishedAt = null;
  }

  const updatedBlog = await prisma.blog.update({
    where: {
      id,
    },
    data: {
      ...data,
      slug,
      publishedAt,
      status: data.status
        ? (data.status.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED")
        : undefined,
      tags: data.tags ? (data.tags as unknown as Prisma.JsonArray) : undefined,
    },
    include: {
      userProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return transformBlogData(updatedBlog);
};

const deleteBlogFromDB = async (id: string): Promise<Blog> => {
  return await prisma.blog.delete({
    where: {
      id,
    },
  });
};

const getBlogStatsFromDB = async (userProfileId?: string) => {
  const whereClause: Prisma.BlogWhereInput = userProfileId
    ? { userProfileId }
    : {};

  const [totalBlogs, publishedBlogs, draftBlogs, archivedBlogs] =
    await Promise.all([
      prisma.blog.count({ where: whereClause }),
      prisma.blog.count({
        where: { ...whereClause, status: "PUBLISHED" },
      }),
      prisma.blog.count({
        where: { ...whereClause, status: "DRAFT" },
      }),
      prisma.blog.count({
        where: { ...whereClause, status: "ARCHIVED" },
      }),
    ]);

  return {
    totalBlogs,
    publishedBlogs,
    draftBlogs,
    archivedBlogs,
  };
};

export const BlogService = {
  createBlogIntoDB,
  getAllBlogsFromDB,
  getPublicBlogsFromDB,
  getBlogBySlugFromDB,
  getSingleBlogFromDB,
  updateBlogIntoDB,
  deleteBlogFromDB,
  getBlogStatsFromDB,
};
