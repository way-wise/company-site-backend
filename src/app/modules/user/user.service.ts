import { Prisma, UserProfile } from "@prisma/client";
import bcrypt from "bcrypt";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import uploadImageS3 from "../../../helpers/s3Uploader";
import meiliClient from "../../../shared/meilisearch";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./user.constant";
import { IUserFilterParams } from "./user.interface";
const meiliClientIndex = meiliClient.index("clients");

// Helper function to assign default role to user
const assignDefaultRole = async (
  userId: string,
  roleName: string,
  txClient?: any
) => {
  const client = txClient || prisma;

  // Find the role by name
  const role = await client.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(
      `Role ${roleName} not found. Please run seed script first.`
    );
  }

  // Assign role to user
  await client.userRoleAssignment.create({
    data: {
      userId,
      roleId: role.id,
    },
  });
};

const getAllUsers = async (
  queryParams: IUserFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.UserWhereInput[] = [];

  // filtering out the soft deleted users
  conditions.push({
    OR: [
      { userProfile: { isDeleted: false } },
      // Users without profiles (like SUPER_ADMIN)
      { userProfile: null },
    ],
  });

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

  const result = await prisma.user.findMany({
    where: { AND: conditions },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      userProfile: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  const total = await prisma.user.count({
    where: { AND: conditions },
  });

  // Transform the data to match frontend expectations
  const transformedResult = result.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((ur) => ur.role),
    isActive: user.status === "ACTIVE",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    contactNumber: user.userProfile?.contactNumber || "",
    gender: user.userProfile?.gender || "MALE",
    image: user.userProfile?.profilePhoto,
  }));

  return {
    meta: {
      page,
      limit,
      total,
    },
    result: transformedResult,
  };
};

const getSingleUserFromDB = async (id: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id,
      OR: [{ userProfile: { isDeleted: false } }, { userProfile: null }],
    },
    include: {
      userProfile: true,
      roles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Transform to match frontend expectations
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((ur) => ur.role),
    isActive: user.status === "ACTIVE",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    contactNumber: user.userProfile?.contactNumber || "",
    gender: user.userProfile?.gender || "MALE",
    image: user.userProfile?.profilePhoto,
    emailVerified: false, // Add this field if needed
  };
};

const createAdmin = async (req: any): Promise<UserProfile> => {
  if (req.file) {
    const uploadedFileUrl = await uploadImageS3(req.file);
    req.body.admin.profilePhoto = uploadedFileUrl;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const userData = {
    name: req.body.admin.name,
    email: req.body.admin.email,
    password: hashedPassword,
  };

  const result = await prisma.$transaction(async (txClient) => {
    // Create user
    const newUser = await txClient.user.create({
      data: userData,
    });

    // Assign ADMIN role
    await assignDefaultRole(newUser.id, "ADMIN", txClient);

    // Create user profile
    const { name, email, ...profileData } = req.body.admin;
    const newUserProfile = await txClient.userProfile.create({
      data: {
        ...profileData,
        userId: newUser.id,
      },
    });

    return newUserProfile;
  });

  return result;
};

const createClient = async (req: any): Promise<UserProfile> => {
  try {
    // Handle file upload if present
    if (req.file) {
      const uploadedFileUrl = await uploadImageS3(req.file);
      if (!uploadedFileUrl) {
        throw new Error("Failed to upload profile photo");
      }
      req.body.client.profilePhoto = uploadedFileUrl;
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const userData = {
      name: req.body.client.name,
      email: req.body.client.email,
      password: hashedPassword,
    };

    const result = await prisma.$transaction(async (txClient) => {
      // Create user first
      const newUser = await txClient.user.create({
        data: userData,
      });

      // Assign CLIENT role
      await assignDefaultRole(newUser.id, "CLIENT", txClient);

      // Create user profile
      const { name, email, ...profileData } = req.body.client;
      const newUserProfile = await txClient.userProfile.create({
        data: {
          ...profileData,
          userId: newUser.id,
        },
      });

      // Add to search index
      try {
        const { id, profilePhoto, contactNumber } = newUserProfile;
        await meiliClientIndex.addDocuments([
          {
            id,
            name: newUser.name,
            email: newUser.email,
            profilePhoto,
            contactNumber,
          },
        ]);
      } catch (searchError) {
        console.error("Failed to add client to search index:", searchError);
        // Don't throw here as the main operation succeeded
      }

      return newUserProfile;
    });

    return result;
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
};

const createEmployee = async (req: any): Promise<UserProfile> => {
  try {
    // Handle file upload if present
    if (req.file) {
      const uploadedFileUrl = await uploadImageS3(req.file);
      if (!uploadedFileUrl) {
        throw new Error("Failed to upload profile photo");
      }
      req.body.employee.profilePhoto = uploadedFileUrl;
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const userData = {
      name: req.body.employee.name,
      email: req.body.employee.email,
      password: hashedPassword,
    };

    const result = await prisma.$transaction(async (txClient) => {
      // Create user first
      const newUser = await txClient.user.create({
        data: userData,
      });

      // Assign EMPLOYEE role
      await assignDefaultRole(newUser.id, "EMPLOYEE", txClient);

      // Create user profile
      const { name, email, ...profileData } = req.body.employee;
      const newUserProfile = await txClient.userProfile.create({
        data: {
          ...profileData,
          userId: newUser.id,
        },
      });

      return newUserProfile;
    });

    return result;
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
};

// Update user
const updateUser = async (userId: string, userData: any) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: userData,
    include: {
      userProfile: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  const result = {
    id: user.id,
    email: user.email,
    name: user.name,
    contactNumber: user.userProfile?.contactNumber || "",
    gender: user.userProfile?.gender || "MALE",
    roles: user.roles.map((ur) => ur.role),
    isActive: user.status === "ACTIVE",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    image: user.userProfile?.profilePhoto,
  };

  return result;
};

// Ban user (soft delete)
const banUser = async (userId: string, banReason: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "BLOCKED" },
    include: {
      userProfile: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    contactNumber: user.userProfile?.contactNumber || "",
    gender: user.userProfile?.gender || "MALE",
    roles: user.roles.map((ur) => ur.role),
    isActive: user.status === "ACTIVE",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    image: user.userProfile?.profilePhoto,
  };
};

// Unban user (activate)
const unbanUser = async (userId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
    include: {
      userProfile: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    contactNumber: user.userProfile?.contactNumber || "",
    gender: user.userProfile?.gender || "MALE",
    roles: user.roles.map((ur) => ur.role),
    isActive: user.status === "ACTIVE",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    image: user.userProfile?.profilePhoto,
  };
};

// Delete user (soft delete)
const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userProfile: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Soft delete the user profile if it exists
  if (user.userProfile) {
    await prisma.userProfile.update({
      where: { id: user.userProfile.id },
      data: { isDeleted: true },
    });
  }

  return { message: "User deleted successfully" };
};

export const userService = {
  getAllUsers,
  createAdmin,
  createClient,
  createEmployee,
  getSingleUserFromDB,
  updateUser,
  banUser,
  unbanUser,
  deleteUser,
};
