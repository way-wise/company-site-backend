import { ProjectFile } from "@prisma/client";
import { createAndEmitNotification } from "../../../helpers/notificationHelper";
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
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    include: {
      userProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  const file = await prisma.projectFile.create({
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

  // Notify project owner (if not the uploader)
  if (project && project.userProfile.id !== data.uploadedBy) {
    await createAndEmitNotification({
      userProfileId: project.userProfile.id,
      type: "FILE",
      title: "New File Uploaded",
      message: `A new file "${data.fileName}" has been uploaded to project "${project.name}"`,
      data: {
        fileId: file.id,
        fileName: data.fileName,
        projectId: project.id,
        projectName: project.name,
      },
    });
  }

  return file;
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

