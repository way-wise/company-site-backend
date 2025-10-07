import { Admin, Client, Employee, Prisma, UserRole } from "@prisma/client";
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
      {
        AND: [{ role: "ADMIN" }, { admin: { isDeleted: false } }],
      },
      {
        AND: [{ role: "CLIENT" }, { client: { isDeleted: false } }],
      },
      {
        AND: [{ role: "EMPLOYEE" }, { employee: { isDeleted: false } }],
      },
      { role: "SUPER_ADMIN" }, // SUPER_ADMIN doesn't have soft delete
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
      admin: true,
      client: true,
      employee: true,
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
    role: user.role,
    isActive: user.status === "ACTIVE",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    contactNumber:
      user.admin?.contactNumber ||
      user.client?.contactNumber ||
      user.employee?.contactNumber ||
      "",
    gender: user.client?.gender || user.employee?.gender || "MALE",
    image:
      user.admin?.profilePhoto ||
      user.client?.profilePhoto ||
      user.employee?.profilePhoto,
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
  return await prisma.user.findUniqueOrThrow({
    where: {
      id,
      OR: [
        { admin: { isDeleted: false } },
        { client: { isDeleted: false } },
        { employee: { isDeleted: false } },
      ],
    },
    include: {
      admin: true,
      client: true,
      employee: true,
    },
  });
};

const createAdmin = async (req: any): Promise<Admin> => {
  if (req.file) {
    const uploadedFileUrl = await uploadImageS3(req.file);
    // const uploadedFile = await fileUploader.saveToCloudinary(req.file);
    // req.body.admin.profilePhoto = uploadedFile?.secure_url;
    req.body.admin.profilePhoto = uploadedFileUrl;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const userData = {
    name: req.body.admin.name,
    email: req.body.admin.email,
    password: hashedPassword,
    role: UserRole.ADMIN,
  };

  const result = await prisma.$transaction(async (txClient) => {
    const newUser = await txClient.user.create({
      data: userData,
    });
    const { name, email, ...adminData } = req.body.admin;
    const newAdmin = await txClient.admin.create({
      data: {
        ...adminData,
        userId: newUser.id,
      },
    });

    const { id, profilePhoto } = newAdmin;

    return newAdmin;
  });

  return result;
};

const createClient = async (req: any): Promise<Client> => {
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
      role: UserRole.CLIENT,
    };

    const result = await prisma.$transaction(async (txClient) => {
      // Create user first
      const newUser = await txClient.user.create({
        data: userData,
      });

      // Create client profile
      const { name, email, ...clientData } = req.body.client;
      const newClient = await txClient.client.create({
        data: {
          ...clientData,
          userId: newUser.id,
        },
      });

      // Add to search index
      try {
        const { id, profilePhoto, contactNumber } = newClient;
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

      return newClient;
    });

    return result;
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
};

const createEmployee = async (req: any): Promise<Employee> => {
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
      role: UserRole.EMPLOYEE,
    };

    const result = await prisma.$transaction(async (txClient) => {
      // Create user first
      const newUser = await txClient.user.create({
        data: userData,
      });

      // Create employee profile
      const { name, email, ...employeeData } = req.body.employee;
      const newEmployee = await txClient.employee.create({
        data: {
          ...employeeData,
          userId: newUser.id,
        },
      });

      return newEmployee;
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
      admin: true,
      client: true,
      employee: true,
    },
  });

  const result = {
    id: user.id,
    email: user.email,
    name: user.name,
    contactNumber:
      user.admin?.contactNumber ||
      user.client?.contactNumber ||
      user.employee?.contactNumber ||
      "",
    gender: user.client?.gender || user.employee?.gender || "MALE",
    role: user.role,
    isActive: user.status === "ACTIVE",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    image:
      user.admin?.profilePhoto ||
      user.client?.profilePhoto ||
      user.employee?.profilePhoto,
  };

  return result;
};

// Ban user (soft delete)
const banUser = async (userId: string, banReason: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "BLOCKED" },
    include: {
      admin: true,
      client: true,
      employee: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    contactNumber:
      user.admin?.contactNumber ||
      user.client?.contactNumber ||
      user.employee?.contactNumber ||
      "",
    gender: user.client?.gender || user.employee?.gender || "MALE",
    role: user.role,
    isActive: user.status === "ACTIVE",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    image:
      user.admin?.profilePhoto ||
      user.client?.profilePhoto ||
      user.employee?.profilePhoto,
  };
};

// Unban user (activate)
const unbanUser = async (userId: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
    include: {
      admin: true,
      client: true,
      employee: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    contactNumber:
      user.admin?.contactNumber ||
      user.client?.contactNumber ||
      user.employee?.contactNumber ||
      "",
    gender: user.client?.gender || user.employee?.gender || "MALE",
    role: user.role,
    isActive: user.status === "ACTIVE",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    image:
      user.admin?.profilePhoto ||
      user.client?.profilePhoto ||
      user.employee?.profilePhoto,
  };
};

// Delete user (soft delete)
const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      admin: true,
      client: true,
      employee: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Soft delete based on role
  if (user.role === "ADMIN" && user.admin) {
    await prisma.admin.update({
      where: { id: user.admin.id },
      data: { isDeleted: true },
    });
  } else if (user.role === "CLIENT" && user.client) {
    await prisma.client.update({
      where: { id: user.client.id },
      data: { isDeleted: true },
    });
  } else if (user.role === "EMPLOYEE" && user.employee) {
    await prisma.employee.update({
      where: { id: user.employee.id },
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
