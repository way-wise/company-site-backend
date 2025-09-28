import { Admin, Client, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import { fileUploader } from "../../../helpers/fileUploader";
import uploadImageS3 from "../../../helpers/s3Uploader";
import meiliClient from "../../../shared/meilisearch";
import prisma from "../../../shared/prismaClient";
const meiliDoctorIndex = meiliClient.index("doctors");
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
  if (req.file) {
    const uploadedFile = await fileUploader.saveToCloudinary(req.file);
    req.body.client.profilePhoto = uploadedFile?.secure_url;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const userData = {
    email: req.body.client.email,
    password: hashedPassword,
    role: UserRole.CLIENT,
  };

  const result = await prisma.$transaction(async (txClient) => {
    await txClient.user.create({
      data: userData,
    });
    const newClient = await txClient.client.create({
      data: req.body.client,
    });

    const { id, name, email, profilePhoto, contactNumber } = newClient;
    await meiliClientIndex.addDocuments([
      { id, name, email, profilePhoto, contactNumber },
    ]);

    return newClient;
  });

  return result;
};

export const userService = {
  createAdmin,
  createClient,
};
