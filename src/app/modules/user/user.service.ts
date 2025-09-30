import { Admin, Client, Prisma, UserRole } from "@prisma/client";
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
      { Admin: { isDeleted: false } },
      { Client: { isDeleted: false } },
      { Employee: { isDeleted: false } },
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
  });

  const total = await prisma.user.count({
    where: { AND: conditions },
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    result,
  };
};

const getSingleUserFromDB = async (id: string) => {
  return await prisma.user.findUniqueOrThrow({
    where: {
      id,
      OR: [
        { Admin: { isDeleted: false } },
        { Client: { isDeleted: false } },
        { Employee: { isDeleted: false } },
      ],
    },
    include: {
      Admin: true,
      Client: true,
      Employee: true,
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
    await txClient.user.create({
      data: userData,
    });
    const newAdmin = await txClient.admin.create({
      data: req.body.admin,
    });

    const { id, name, email, profilePhoto } = newAdmin;

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
      const newClient = await txClient.client.create({
        data: req.body.client,
      });

      // Add to search index
      try {
        const { id, name, email, profilePhoto, contactNumber } = newClient;
        await meiliClientIndex.addDocuments([
          { id, name, email, profilePhoto, contactNumber },
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

export const userService = {
  getAllUsers,
  createAdmin,
  createClient,
  getSingleUserFromDB,
};
