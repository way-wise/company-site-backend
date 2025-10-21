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

// Helper function to build base user query conditions
const buildUserQueryConditions = (
  queryParams: IUserFilterParams,
  roleId?: string
) => {
  const { q, ...otherQueryParams } = queryParams;
  const conditions: Prisma.UserWhereInput[] = [];

  // Filter out soft deleted users
  conditions.push({
    OR: [
      { userProfile: { isDeleted: false } },
      { userProfile: null }, // Users without profiles (like SUPER_ADMIN)
    ],
  });

  // Filter by role if roleId is provided
  if (roleId) {
    conditions.push({
      roles: {
        some: { roleId },
      },
    });
  }

  // Searching
  if (q) {
    const searchConditions = searchableFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
    conditions.push({ OR: searchConditions });
  }

  // Filtering with exact value
  if (Object.keys(otherQueryParams).length > 0) {
    const filterData = Object.keys(otherQueryParams).map((key) => ({
      [key]: (otherQueryParams as any)[key],
    }));
    conditions.push(...filterData);
  }

  return conditions;
};

// Helper function to transform user data
const transformUserData = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  roles: user.roles.map((ur: any) => ur.role),
  status: user.status,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
  contactNumber: user.userProfile?.contactNumber || "",
  gender: user.userProfile?.gender || "MALE",
  image: user.userProfile?.profilePhoto,
  userProfile: user.userProfile || null,
});

const getAllUsers = async (
  queryParams: IUserFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions(paginationAndSortingQueryParams);

  // Extract role name from queryParams and find the roleId
  let roleId: string | undefined = undefined;
  if (queryParams.role) {
    const role = await prisma.role.findUnique({
      where: { name: queryParams.role },
    });
    roleId = role?.id;
  }

  // Remove role from queryParams since we'll use roleId instead
  const { role, ...otherQueryParams } = queryParams;

  const conditions = buildUserQueryConditions(otherQueryParams, roleId);

  const [result, total] = await Promise.all([
    prisma.user.findMany({
      where: { AND: conditions },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        userProfile: true,
        roles: {
          include: { role: true },
        },
      },
    }),
    prisma.user.count({ where: { AND: conditions } }),
  ]);

  return {
    meta: { page, limit, total },
    result: result.map(transformUserData),
  };
};

const getSingleUserFromDB = async (id: string) => {
  const user = (await prisma.user.findUniqueOrThrow({
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
  })) as Prisma.UserGetPayload<{
    include: {
      userProfile: true;
      roles: { include: { role: true } };
    };
  }>;

  // Transform to match frontend expectations
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((ur: any) => ur.role),
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    contactNumber: user.userProfile?.contactNumber || "",
    gender: user.userProfile?.gender || "MALE",
    image: user.userProfile?.profilePhoto,
    userProfile: user.userProfile || null,
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
    roles: user.roles.map((ur: any) => ur.role),
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    image: user.userProfile?.profilePhoto,
    userProfile: user.userProfile || null,
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
    roles: user.roles.map((ur: any) => ur.role),
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    image: user.userProfile?.profilePhoto,
    userProfile: user.userProfile || null,
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
    roles: user.roles.map((ur: any) => ur.role),
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    image: user.userProfile?.profilePhoto,
    userProfile: user.userProfile || null,
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

// Get users by role
const getUsersByRole = async (
  roleId: string,
  queryParams: IUserFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions(paginationAndSortingQueryParams);

  const conditions = buildUserQueryConditions(queryParams, roleId);

  const [result, total] = await Promise.all([
    prisma.user.findMany({
      where: { AND: conditions },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        userProfile: true,
        roles: {
          include: { role: true },
        },
      },
    }),
    prisma.user.count({ where: { AND: conditions } }),
  ]);

  return {
    meta: { page, limit, total },
    result: result.map(transformUserData),
  };
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
  getUsersByRole,
};
