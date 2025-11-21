import { Prisma, Project } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import { createAndEmitNotification } from "../../../helpers/notificationHelper";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./project.constants";
import { IProjectFilterParams } from "./project.interface";

const createProjectIntoDB = async (data: {
  name: string;
  description?: string;
  status?: string;
  userProfileId: string;
}): Promise<Project> => {
  // Validate that userProfileId exists
  const userProfile = await prisma.userProfile.findUnique({
    where: { id: data.userProfileId },
  });

  if (!userProfile) {
    throw new Error(`UserProfile with id ${data.userProfileId} not found`);
  }

  return await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      status: data.status as any,
      userProfileId: data.userProfileId,
    },
  });
};

const getAllProjectsFromDB = async (
  queryParams: IProjectFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams,
  user?: any
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
    });

  const conditions: Prisma.ProjectWhereInput[] = [];

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

    console.log("🔍 Project filtering debug:", {
      userId: user.id,
      permissions: permissions,
      userProfile: userProfile ? { id: userProfile.id } : null,
      hasViewAllProjects: permissions.includes("view_all_projects"),
      hasReadProject: permissions.includes("read_project"),
    });

    // Check if user has permission to view all projects
    const canViewAllProjects = permissions.includes("view_all_projects");

    if (!canViewAllProjects) {
      const canViewProjects = permissions.includes("read_project");

      if (canViewProjects && userProfile) {
        // User sees: own projects OR assigned projects
        conditions.push({
          OR: [
            { userProfileId: userProfile.id }, // Own projects
            {
              milestones: {
                some: {
                  employeeMilestones: {
                    some: { userProfileId: userProfile.id },
                  },
                },
              },
            }, // Assigned projects
          ],
        });
        console.log(
          "✅ Applied filtering for user with read_project permission"
        );
      } else {
        // No permission to view projects - return empty
        conditions.push({ id: "no-access" }); // Will return no results
        console.log("❌ No permission to view projects - returning empty");
      }
    } else {
      console.log(
        "✅ User has view_all_projects permission - no filtering applied"
      );
    }
    // If canViewAllProjects: No additional filter, see all projects
  } else {
    console.log("⚠️ No user context provided to project service");
  }

  const result = await prisma.project.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      userProfile: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      milestones: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      _count: {
        select: {
          milestones: true,
        },
      },
    },
  });

  const total = await prisma.project.count({
    where: conditions.length > 0 ? { AND: conditions } : {},
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

const getSingleProjectFromDB = async (id: string) => {
  return await prisma.project.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      userProfile: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      milestones: {
        include: {
          employeeMilestones: {
            include: {
              userProfile: {
                select: {
                  id: true,
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
          },
          serviceMilestones: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          Task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              progress: true,
            },
          },
        },
      },
    },
  });
};

const updateProjectIntoDB = async (
  id: string,
  data: Partial<Project>
): Promise<Project> => {
  const existingProject = await prisma.project.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      milestones: {
        include: {
          employeeMilestones: {
            select: {
              userProfileId: true,
            },
          },
        },
      },
    },
  });

  const updatedProject = await prisma.project.update({
    where: {
      id,
    },
    data,
  });

  // Notify project owner and assigned employees if status changed
  if (data.status && data.status !== existingProject.status) {
    const allUserIds = [
      existingProject.userProfileId,
      ...existingProject.milestones.flatMap((m) =>
        m.employeeMilestones.map((em) => em.userProfileId)
      ),
    ];
    const uniqueUserIds = Array.from(new Set(allUserIds));

    for (const userProfileId of uniqueUserIds) {
      await createAndEmitNotification({
        userProfileId,
        type: "PROJECT",
        title: "Project Status Updated",
        message: `Project "${existingProject.name}" status changed to ${data.status}`,
        data: {
          projectId: existingProject.id,
          projectName: existingProject.name,
          oldStatus: existingProject.status,
          newStatus: data.status,
        },
      });
    }
  }

  return updatedProject;
};

const deleteProjectFromDB = async (id: string): Promise<Project> => {
  const project = await prisma.project.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          milestones: true,
        },
      },
    },
  });

  if (project._count.milestones > 0) {
    throw new Error(
      "Cannot delete project with existing milestones. Delete milestones first."
    );
  }

  return await prisma.project.delete({
    where: {
      id,
    },
  });
};

export const ProjectService = {
  createProjectIntoDB,
  getAllProjectsFromDB,
  getSingleProjectFromDB,
  updateProjectIntoDB,
  deleteProjectFromDB,
};
