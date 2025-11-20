import { ProjectFile } from "@prisma/client";
import prisma from "../../../shared/prismaClient";

const getFilesByProjectId = async (
  projectId: string
): Promise<ProjectFile[]> => {
  return await prisma.projectFile.findMany({
    where: { projectId },
    include: {
      uploader: {
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
    orderBy: {
      createdAt: "desc",
    },
  });
};

const createFile = async (data: {
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
}): Promise<ProjectFile> => {
  return await prisma.projectFile.create({
    data,
    include: {
      uploader: {
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
};

const deleteFile = async (id: string): Promise<ProjectFile> => {
  return await prisma.projectFile.delete({
    where: { id },
  });
};

const getFileById = async (id: string): Promise<ProjectFile | null> => {
  return await prisma.projectFile.findUnique({
    where: { id },
    include: {
      uploader: {
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
};

export const ProjectFileService = {
  getFilesByProjectId,
  createFile,
  deleteFile,
  getFileById,
};

