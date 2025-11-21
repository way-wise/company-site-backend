import { Milestone, Prisma } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import { createAndEmitNotification } from "../../../helpers/notificationHelper";
import prisma from "../../../shared/prismaClient";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./milestone.constants";
import { IMilestoneFilterParams } from "./milestone.interface";

const createMilestoneIntoDB = async (
  data: Prisma.MilestoneCreateInput
): Promise<Milestone> => {
  // Get projectId from the data
  const projectId = 
    typeof data.project?.connect?.id === "string" 
      ? data.project.connect.id 
      : (data as any).projectId;

  if (!projectId) {
    throw new Error("Project ID is required");
  }

  // Calculate the next index for this project (starting at 1)
  const maxIndexResult = await prisma.milestone.findFirst({
    where: { projectId },
    orderBy: { index: "desc" },
    select: { index: true },
  });

  const nextIndex = maxIndexResult ? maxIndexResult.index + 1 : 1;

  // Extract data without projectId (since we'll use relation syntax)
  const { projectId: _, ...restData } = data as any;

  // Convert date strings to DateTime objects if provided
  const convertDateString = (dateString: string | Date | undefined): Date | undefined => {
    if (!dateString) return undefined;
    if (dateString instanceof Date) return dateString;
    // If it's a date string (YYYY-MM-DD), convert to DateTime at midnight UTC
    if (typeof dateString === "string") {
      // Check if it's already a full ISO string
      if (dateString.includes("T")) {
        return new Date(dateString);
      }
      // If it's just a date (YYYY-MM-DD), add time to make it a proper DateTime
      return new Date(`${dateString}T00:00:00.000Z`);
    }
    return undefined;
  };

  // Set default payment status to UNPAID and add index
  const milestoneData: Prisma.MilestoneCreateInput = {
    ...restData,
    startDate: convertDateString(restData.startDate),
    endDate: convertDateString(restData.endDate),
    project: {
      connect: { id: projectId },
    },
    index: nextIndex,
    paymentStatus: "UNPAID",
  };

  return await prisma.milestone.create({
    data: milestoneData,
  });
};

const getAllMilestonesFromDB = async (
  queryParams: IMilestoneFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
      sortBy: paginationAndSortingQueryParams.sortBy || "index",
      sortOrder: paginationAndSortingQueryParams.sortOrder || "asc",
    });

  const conditions: Prisma.MilestoneWhereInput[] = [];

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

  const result = await prisma.milestone.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: sortBy === "index" 
      ? { index: sortOrder as "asc" | "desc" }
      : {
          [sortBy]: sortOrder,
        },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
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
        include: {
          creator: {
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
          assignments: {
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
        },
      },
      _count: {
        select: {
          employeeMilestones: true,
          serviceMilestones: true,
          Task: true,
        },
      },
      payments: {
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          paidAt: true,
          status: true,
          paymentMethod: {
            select: {
              cardLast4: true,
              cardBrand: true,
            },
          },
        },
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  });

  const total = await prisma.milestone.count({
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

const getSingleMilestoneFromDB = async (id: string) => {
  return await prisma.milestone.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
        },
      },
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
        include: {
          creator: {
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
          assignments: {
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
        },
      },
      payments: {
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          paidAt: true,
          status: true,
          paymentMethod: {
            select: {
              cardLast4: true,
              cardBrand: true,
            },
          },
        },
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  });
};

const updateMilestoneIntoDB = async (
  id: string,
  data: Partial<Milestone>
): Promise<Milestone> => {
  const existingMilestone = await prisma.milestone.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      project: {
        include: {
          userProfile: {
            select: {
              id: true,
            },
          },
        },
      },
      employeeMilestones: {
        select: {
          userProfileId: true,
        },
      },
    },
  });

  // Convert date strings to DateTime objects if provided
  const convertDateString = (dateString: string | Date | undefined | null): Date | undefined | null => {
    if (dateString === null || dateString === undefined) return dateString;
    if (dateString instanceof Date) return dateString;
    // If it's a date string (YYYY-MM-DD), convert to DateTime at midnight UTC
    if (typeof dateString === "string") {
      // Check if it's already a full ISO string
      if (dateString.includes("T")) {
        return new Date(dateString);
      }
      // If it's just a date (YYYY-MM-DD), add time to make it a proper DateTime
      return new Date(`${dateString}T00:00:00.000Z`);
    }
    return undefined;
  };

  const updateData: Partial<Milestone> = {
    ...data,
  };

  // Convert dates if they exist in the update data
  if ("startDate" in data) {
    updateData.startDate = convertDateString(data.startDate as string | Date | undefined | null) as any;
  }
  if ("endDate" in data) {
    updateData.endDate = convertDateString(data.endDate as string | Date | undefined | null) as any;
  }

  const updatedMilestone = await prisma.milestone.update({
    where: {
      id,
    },
    data: updateData,
  });

  // Notify project owner and assigned employees if status changed
  if (data.status && data.status !== existingMilestone.status) {
    const allUserIds = [
      existingMilestone.project.userProfile.id,
      ...existingMilestone.employeeMilestones.map((em) => em.userProfileId),
    ];
    const uniqueUserIds = Array.from(new Set(allUserIds));

    for (const userProfileId of uniqueUserIds) {
      await createAndEmitNotification({
        userProfileId,
        type: "MILESTONE",
        title: "Milestone Status Updated",
        message: `Milestone "${existingMilestone.name}" status changed to ${data.status}`,
        data: {
          milestoneId: existingMilestone.id,
          milestoneName: existingMilestone.name,
          oldStatus: existingMilestone.status,
          newStatus: data.status,
          projectId: existingMilestone.project.id,
        },
      });
    }
  }

  return updatedMilestone;
};

const deleteMilestoneFromDB = async (id: string): Promise<Milestone> => {
  const milestone = await prisma.milestone.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          Task: true,
        },
      },
    },
  });

  if (milestone._count.Task > 0) {
    throw new Error(
      "Cannot delete milestone with existing tasks. Delete tasks first."
    );
  }

  return await prisma.milestone.delete({
    where: {
      id,
    },
  });
};

const assignEmployeesToMilestone = async (
  milestoneId: string,
  userProfileIds: string[]
) => {
  // First verify milestone exists and get project info
  const milestone = await prisma.milestone.findUniqueOrThrow({
    where: { id: milestoneId },
    include: {
      project: {
        select: {
          id: true,
        },
      },
    },
  });

  // Get existing employee assignments before deletion
  const existingAssignments = await prisma.employeeMilestone.findMany({
    where: { milestoneId },
    select: { userProfileId: true },
  });
  const existingEmployeeIds = new Set(
    existingAssignments.map((a) => a.userProfileId)
  );

  // Find new employees (not previously assigned)
  const newEmployeeIds = userProfileIds.filter(
    (id) => !existingEmployeeIds.has(id)
  );

  // Delete existing assignments
  await prisma.employeeMilestone.deleteMany({
    where: { milestoneId },
  });

  // Create new assignments
  const assignments = userProfileIds.map((userProfileId) => ({
    milestoneId,
    userProfileId,
  }));

  await prisma.employeeMilestone.createMany({
    data: assignments,
  });

  // Auto-sync: Add new employees to project chat if it exists
  if (newEmployeeIds.length > 0 && milestone.project) {
    const projectConversation = await prisma.conversation.findFirst({
      where: {
        type: "PROJECT",
        projectId: milestone.project.id,
      },
      include: {
        participants: {
          select: {
            userProfileId: true,
          },
        },
      },
    });

    if (projectConversation) {
      // Filter out employees who are already participants
      const existingParticipantIds = new Set(
        projectConversation.participants.map((p) => p.userProfileId)
      );
      const employeesToAdd = newEmployeeIds.filter(
        (id) => !existingParticipantIds.has(id)
      );

      // Add new employees to the project chat
      if (employeesToAdd.length > 0) {
        await prisma.conversationParticipant.createMany({
          data: employeesToAdd.map((userProfileId) => ({
            conversationId: projectConversation.id,
            userProfileId,
            isAdmin: true, // PROJECT chat participants are admins
          })),
          skipDuplicates: true,
        });

        // Emit SSE events to notify new participants
        try {
          const { broadcastToUser } = require("../../../sse");

          // Fetch updated conversation for SSE event
          const updatedConversation = await prisma.conversation.findUnique({
            where: { id: projectConversation.id },
            include: {
              participants: {
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
                      profilePhoto: true,
                    },
                  },
                },
              },
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          // Notify new employees about the conversation
          const newParticipantPromises = employeesToAdd.map((userProfileId) =>
            broadcastToUser(userProfileId, "conversation:new", updatedConversation)
          );
          await Promise.all(newParticipantPromises);

          // Notify all participants about the update
          const updatePromises = updatedConversation?.participants.map(
            (participant) =>
              broadcastToUser(
                participant.userProfileId,
                "conversation:updated",
                updatedConversation
              )
          );
          if (updatePromises) {
            await Promise.all(updatePromises);
          }
        } catch (error) {
          console.error(
            "Error emitting SSE events for auto-added participants:",
            error
          );
        }
      }
    }
  }

  // Find employees removed from this milestone
  const removedEmployeeIds = Array.from(existingEmployeeIds).filter(
    (id) => !userProfileIds.includes(id)
  );

  // Auto-sync: Remove employees from project chat if they're no longer in ANY milestone
  if (removedEmployeeIds.length > 0 && milestone.project) {
    // Check each removed employee
    for (const removedId of removedEmployeeIds) {
      // Check if they're still assigned to any other milestone in this project
      const stillAssigned = await prisma.employeeMilestone.findFirst({
        where: {
          userProfileId: removedId,
          milestone: {
            projectId: milestone.project.id,
            id: { not: milestoneId }, // Exclude current milestone
          },
        },
      });

      // Only remove from chat if not assigned to any other milestone
      if (!stillAssigned) {
        const projectConversation = await prisma.conversation.findFirst({
          where: {
            type: "PROJECT",
            projectId: milestone.project.id,
          },
        });

        if (projectConversation) {
          await prisma.conversationParticipant.deleteMany({
            where: {
              conversationId: projectConversation.id,
              userProfileId: removedId,
            },
          });

          // Emit SSE event
          try {
            const { broadcastToUser } = require("../../../sse");
            await broadcastToUser(removedId, "conversation:removed", {
              conversationId: projectConversation.id,
            });
          } catch (error) {
            console.error("Error emitting removal event:", error);
          }
        }
      }
    }
  }

  return await prisma.milestone.findUnique({
    where: { id: milestoneId },
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
    },
  });
};

const assignServicesToMilestone = async (
  milestoneId: string,
  serviceIds: string[]
) => {
  // First verify milestone exists
  await prisma.milestone.findUniqueOrThrow({
    where: { id: milestoneId },
  });

  // Delete existing assignments
  await prisma.serviceMilestone.deleteMany({
    where: { milestoneId },
  });

  // Create new assignments
  const assignments = serviceIds.map((serviceId) => ({
    milestoneId,
    serviceId,
  }));

  await prisma.serviceMilestone.createMany({
    data: assignments,
  });

  return await prisma.milestone.findUnique({
    where: { id: milestoneId },
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
    },
  });
};

export const MilestoneService = {
  createMilestoneIntoDB,
  getAllMilestonesFromDB,
  getSingleMilestoneFromDB,
  updateMilestoneIntoDB,
  deleteMilestoneFromDB,
  assignEmployeesToMilestone,
  assignServicesToMilestone,
};
