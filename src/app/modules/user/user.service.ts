import { Admin, Client, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import uploadImageS3 from "../../../helpers/s3Uploader";
import meiliClient from "../../../shared/meilisearch";
import prisma from "../../../shared/prismaClient";
const meiliClientIndex = meiliClient.index("clients");

const createAdmin = async (req: any): Promise<Admin> => {
  if (req.file) {
    const uploadedFileUrl = await uploadImageS3(req.file);
    // const uploadedFile = await fileUploader.saveToCloudinary(req.file);
    // req.body.admin.profilePhoto = uploadedFile?.secure_url;
    req.body.admin.profilePhoto = uploadedFileUrl;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const userData = {
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
  createAdmin,
  createClient,
};
