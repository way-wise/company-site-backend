import { ProjectNote } from "@prisma/client";
import prisma from "../../../shared/prismaClient";

const getNoteByProjectId = async (
  projectId: string
): Promise<ProjectNote | null> => {
  return await prisma.projectNote.findUnique({
    where: { projectId },
    include: {
      creator: {
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

const createOrUpdateNote = async (data: {
  projectId: string;
  content: string;
  createdBy: string;
}): Promise<ProjectNote> => {
  return await prisma.projectNote.upsert({
    where: { projectId: data.projectId },
    update: {
      content: data.content,
      updatedAt: new Date(),
    },
    create: {
      projectId: data.projectId,
      content: data.content,
      createdBy: data.createdBy,
    },
    include: {
      creator: {
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

const updateNote = async (
  id: string,
  data: { content: string }
): Promise<ProjectNote> => {
  return await prisma.projectNote.update({
    where: { id },
    data: {
      content: data.content,
      updatedAt: new Date(),
    },
    include: {
      creator: {
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

export const ProjectNoteService = {
  getNoteByProjectId,
  createOrUpdateNote,
  updateNote,
};

