import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import { getIO } from "../../../socket";
import { HTTPError } from "../../errors/HTTPError";
import { createAndEmitNotification } from "../../../helpers/notificationHelper";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./chat.constants";
import {
  IAddParticipantsPayload,
  IConversationFilterParams,
  ICreateConversationPayload,
  IChatAttachment,
  IConversationMediaItem,
  ICreateMessagePayload,
} from "./chat.interface";

type MessageWithSender = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        id: true;
        user: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
        profilePhoto: true;
      };
    };
  };
}>;

const createConversationIntoDB = async (
  currentUserProfileId: string,
  payload: ICreateConversationPayload
) => {
  const { type, name, projectId, participantIds } = payload;

  // Validate conversation type
  if (type === "DIRECT" && participantIds.length !== 1) {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "Direct conversations must have exactly one other participant"
    );
  }

  // For DIRECT conversations, check if conversation already exists
  if (type === "DIRECT") {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          {
            participants: {
              some: {
                userProfileId: currentUserProfileId,
              },
            },
          },
          {
            participants: {
              some: {
                userProfileId: participantIds[0],
              },
            },
          },
        ],
      },
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
      },
    });

    if (existingConversation) {
      return existingConversation;
    }
  }

  // If PROJECT type, verify project exists and prepare auto-participants
  let autoParticipantIds: string[] = [];
  if (type === "PROJECT" && projectId) {
    // Check if conversation already exists for this project
    const existingProjectConversation = await prisma.conversation.findFirst({
      where: {
        type: "PROJECT",
        projectId: projectId,
      },
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

    if (existingProjectConversation) {
      return existingProjectConversation;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
        userProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!project) {
      throw new HTTPError(httpStatus.NOT_FOUND, "Project not found");
    }

    // 1. Get all users with ADMIN role
    const adminUsers = await prisma.userProfile.findMany({
      where: {
        user: {
          roles: {
            some: {
              role: {
                name: "ADMIN",
              },
            },
          },
        },
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    // 2. Get all employees assigned to project milestones
    const milestoneEmployeeIds = new Set<string>();
    project.milestones.forEach((milestone) => {
      milestone.employeeMilestones.forEach((emp) => {
        milestoneEmployeeIds.add(emp.userProfileId);
      });
    });

    // 3. Get project client
    const clientId = project.userProfile.id;

    // 4. Combine all unique userProfileIds
    autoParticipantIds = [
      ...adminUsers.map((admin) => admin.id),
      ...Array.from(milestoneEmployeeIds),
      clientId,
    ];

    // Remove duplicates and current user (will be added separately as admin)
    autoParticipantIds = Array.from(
      new Set(autoParticipantIds.filter((id) => id !== currentUserProfileId))
    );
  }

  // Determine which participant IDs to use
  const finalParticipantIds =
    type === "PROJECT" ? autoParticipantIds : participantIds;

  // Create conversation with participants
  const conversation = await prisma.conversation.create({
    data: {
      type,
      name,
      projectId,
      participants: {
        create: [
          // Add current user as admin
          {
            userProfileId: currentUserProfileId,
            isAdmin: true,
          },
          // Add other participants
          ...finalParticipantIds.map((id: string) => ({
            userProfileId: id,
            isAdmin: type === "DIRECT" || type === "PROJECT", // In DIRECT and PROJECT chats, all are admins (for PROJECT, admins can manage)
          })),
        ],
      },
    },
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

  // Create notifications for all participants except the creator
  try {
    const conversationName = conversation.name || 
      (conversation.type === "DIRECT" 
        ? conversation.participants.find(p => p.userProfileId !== currentUserProfileId)?.userProfile?.user?.name || "Direct Message"
        : conversation.type === "PROJECT" && conversation.project
        ? conversation.project.name
        : "New Conversation");

    for (const participant of conversation.participants) {
      // Skip notification for the creator
      if (participant.userProfileId === currentUserProfileId) {
        continue;
      }

      await createAndEmitNotification({
        userProfileId: participant.userProfileId,
        type: "CHAT",
        title: "New Conversation",
        message: `You have been added to a conversation: ${conversationName}`,
        data: {
          conversationId: conversation.id,
          conversationName,
          conversationType: conversation.type,
        },
      });
    }
  } catch (error) {
    console.error("Error creating conversation notifications:", error);
  }

  // Emit socket event to notify all participants about the new conversation
  try {
    const io = getIO();
    conversation.participants.forEach((participant) => {
      io.to(`user:${participant.userProfileId}`).emit(
        "conversation:new",
        conversation
      );
    });
  } catch (error) {
    console.error("Error emitting conversation:new event:", error);
  }

  return conversation;
};

const fetchConversationParticipantIds = async (conversationId: string) => {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userProfileId: true },
  });

  return participants.map((participant) => participant.userProfileId);
};

const ensureConversationParticipant = async (
  conversationId: string,
  userProfileId: string
) => {
  const participantIds = await fetchConversationParticipantIds(conversationId);

  if (!participantIds.includes(userProfileId)) {
    throw new HTTPError(
      httpStatus.FORBIDDEN,
      "You are not a participant in this conversation"
    );
  }

  return participantIds;
};

const broadcastMessageEvents = async (
  conversationId: string,
  participantIds: string[],
  message: MessageWithSender
) => {
  try {
    const io = getIO();
    io.to(conversationId).emit("message:new", message);

    participantIds.forEach((participantId) => {
      io.to(`user:${participantId}`).emit("conversation:updated", {
        conversationId,
        lastMessage: message,
        updatedAt: new Date(),
      });
    });
  } catch (error) {
    console.error("Error emitting message events:", error);
  }
};

const createMessageRecord = async (
  conversationId: string,
  senderId: string,
  payload: ICreateMessagePayload
): Promise<{ message: MessageWithSender; participantIds: string[] }> => {
  const trimmedContent = payload.content?.trim() ?? "";
  const attachments =
    payload.attachments && payload.attachments.length > 0
      ? payload.attachments
      : undefined;

  if (!trimmedContent && !attachments) {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "Message content or attachments are required"
    );
  }

  const participantIds = await ensureConversationParticipant(
    conversationId,
    senderId
  );

  const serializedAttachments = attachments
    ? (attachments.map((attachment) => ({ ...attachment })) as unknown as Prisma.JsonArray)
    : undefined;

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: trimmedContent,
      attachments: serializedAttachments,
    },
    include: {
      sender: {
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
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return { message, participantIds };
};

const createMessage = async (
  conversationId: string,
  senderId: string,
  payload: ICreateMessagePayload
): Promise<MessageWithSender> => {
  const { message, participantIds } = await createMessageRecord(
    conversationId,
    senderId,
    payload
  );

  // Get conversation details for notification
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      name: true,
      type: true,
      project: {
        select: {
          name: true,
        },
      },
    },
  });

  // Create notifications for all participants except the sender
  try {
    const conversationName = 
      conversation?.name || 
      (conversation?.type === "PROJECT" && conversation?.project?.name
        ? conversation.project.name
        : "Conversation");

    const senderName = message.sender.user?.name || "Someone";
    const messagePreview = message.content 
      ? (message.content.length > 50 ? message.content.substring(0, 50) + "..." : message.content)
      : message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0
      ? "sent an attachment"
      : "sent a message";

    for (const participantId of participantIds) {
      // Skip notification for the sender
      if (participantId === senderId) {
        continue;
      }

      await createAndEmitNotification({
        userProfileId: participantId,
        type: "CHAT",
        title: "New Message",
        message: `${senderName}: ${messagePreview}`,
        data: {
          conversationId: conversationId,
          messageId: message.id,
          senderId: senderId,
          conversationName,
        },
      });
    }
  } catch (error) {
    console.error("Error creating message notifications:", error);
  }

  await broadcastMessageEvents(conversationId, participantIds, message);
  return message;
};

const getUserConversationsFromDB = async (
  currentUserProfileId: string,
  queryParams: IConversationFilterParams,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  const { q, ...otherQueryParams } = queryParams;

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
      sortBy: paginationAndSortingQueryParams.sortBy || "updatedAt",
      sortOrder: paginationAndSortingQueryParams.sortOrder || "desc",
    });

  const conditions: Prisma.ConversationWhereInput[] = [
    {
      participants: {
        some: {
          userProfileId: currentUserProfileId,
        },
      },
    },
  ];

  // Searching
  if (q) {
    const searchConditions = searchableFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
    conditions.push({ OR: searchConditions });
  }

  // Filtering
  if (Object.keys(otherQueryParams).length > 0) {
    const filterData = Object.keys(otherQueryParams).map((key) => ({
      [key]: (otherQueryParams as any)[key],
    }));
    conditions.push(...filterData);
  }

  const result = await prisma.conversation.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
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
      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sender: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                },
              },
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
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  // Calculate unread count for each conversation
  const conversationsWithUnread = await Promise.all(
    result.map(async (conversation) => {
      const participant = conversation.participants.find(
        (p) => p.userProfileId === currentUserProfileId
      );

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          createdAt: {
            gt: participant?.lastReadAt || new Date(0),
          },
          senderId: {
            not: currentUserProfileId,
          },
        },
      });

      return {
        ...conversation,
        lastMessage: conversation.messages[0] || null,
        unreadCount,
      };
    })
  );

  const total = await prisma.conversation.count({
    where: conditions.length > 0 ? { AND: conditions } : {},
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    result: conversationsWithUnread,
  };
};

const getSingleConversationFromDB = async (
  conversationId: string,
  currentUserProfileId: string
) => {
  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId,
      userProfileId: currentUserProfileId,
    },
  });

  if (!participant) {
    throw new HTTPError(
      httpStatus.FORBIDDEN,
      "You are not a participant in this conversation"
    );
  }

  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: {
      id: conversationId,
    },
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
          description: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  return conversation;
};

const getConversationMessagesFromDB = async (
  conversationId: string,
  currentUserProfileId: string,
  paginationAndSortingQueryParams: IPaginationParams & ISortingParams
) => {
  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId,
      userProfileId: currentUserProfileId,
    },
  });

  if (!participant) {
    throw new HTTPError(
      httpStatus.FORBIDDEN,
      "You are not a participant in this conversation"
    );
  }

  const { limit, skip, page, sortBy, sortOrder } =
    generatePaginateAndSortOptions({
      ...paginationAndSortingQueryParams,
      limit: paginationAndSortingQueryParams.limit || "50",
      sortBy: paginationAndSortingQueryParams.sortBy || "createdAt",
      sortOrder: paginationAndSortingQueryParams.sortOrder || "desc",
    });

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      sender: {
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
  });

  const total = await prisma.message.count({
    where: {
      conversationId,
    },
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    result: messages.reverse(), // Reverse to show oldest first in UI
  };
};

const getConversationMediaFromDB = async (
  conversationId: string,
  currentUserProfileId: string
): Promise<IConversationMediaItem[]> => {
  await ensureConversationParticipant(conversationId, currentUserProfileId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      createdAt: true,
      attachments: true,
    },
  });

  const mediaItems: IConversationMediaItem[] = [];

  messages.forEach((message) => {
    if (!Array.isArray(message.attachments)) {
      return;
    }

    (message.attachments as unknown[]).forEach((attachment, index) => {
      if (!attachment || typeof attachment !== "object") {
        return;
      }

      const parsed = attachment as Partial<IChatAttachment>;

      if (typeof parsed.url !== "string") {
        return;
      }

      const mimeType =
        typeof parsed.mimeType === "string"
          ? parsed.mimeType
          : "application/octet-stream";

      const attachmentType =
        parsed.type === "image" || parsed.type === "document"
          ? parsed.type
          : mimeType.startsWith("image/")
          ? "image"
          : "document";

      const uploadedAt =
        typeof parsed.uploadedAt === "string"
          ? parsed.uploadedAt
          : message.createdAt.toISOString();

      mediaItems.push({
        id:
          typeof parsed.id === "string"
            ? parsed.id
            : `${message.id}-${index}`,
        key: typeof parsed.key === "string" ? parsed.key : "",
        url: parsed.url,
        name:
          typeof parsed.name === "string"
            ? parsed.name
            : `attachment-${index + 1}`,
        mimeType,
        size: typeof parsed.size === "number" ? parsed.size : 0,
        type: attachmentType,
        uploadedAt,
        messageId: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        messageCreatedAt: message.createdAt.toISOString(),
      });
    });
  });

  return mediaItems.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
};

const addParticipantsToConversation = async (
  conversationId: string,
  currentUserProfileId: string,
  payload: IAddParticipantsPayload
) => {
  // Verify conversation exists and user is admin
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: true,
    },
  });

  if (!conversation) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Conversation not found");
  }

  // Check if user is admin
  const isAdmin = conversation.participants.some(
    (p) => p.userProfileId === currentUserProfileId && p.isAdmin
  );

  if (!isAdmin) {
    throw new HTTPError(
      httpStatus.FORBIDDEN,
      "Only admins can add participants"
    );
  }

  // Don't allow adding participants to DIRECT conversations
  if (conversation.type === "DIRECT") {
    throw new HTTPError(
      httpStatus.BAD_REQUEST,
      "Cannot add participants to direct conversations"
    );
  }

  // For PROJECT conversations, validate that participants are project-related
  if (conversation.type === "PROJECT" && conversation.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: conversation.projectId },
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
        userProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!project) {
      throw new HTTPError(httpStatus.NOT_FOUND, "Project not found");
    }

    // Get all valid participant IDs for this project
    const validParticipantIds = new Set<string>();

    // 1. Add all admins
    const adminUsers = await prisma.userProfile.findMany({
      where: {
        user: {
          roles: {
            some: {
              role: {
                name: "ADMIN",
              },
            },
          },
        },
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });
    adminUsers.forEach((admin) => validParticipantIds.add(admin.id));

    // 2. Add milestone employees
    project.milestones.forEach((milestone) => {
      milestone.employeeMilestones.forEach((emp) => {
        validParticipantIds.add(emp.userProfileId);
      });
    });

    // 3. Add project client
    validParticipantIds.add(project.userProfile.id);

    // Validate each new participant
    const invalidParticipants = payload.userProfileIds.filter(
      (id) => !validParticipantIds.has(id)
    );

    if (invalidParticipants.length > 0) {
      throw new HTTPError(
        httpStatus.BAD_REQUEST,
        "Cannot add participants who are not part of the project (admins, milestone employees, or project client)"
      );
    }
  }

  // Add new participants
  await prisma.conversationParticipant.createMany({
    data: payload.userProfileIds.map((userProfileId) => ({
      conversationId,
      userProfileId,
    })),
    skipDuplicates: true,
  });

  const updatedConversation = await getSingleConversationFromDB(
    conversationId,
    currentUserProfileId
  );

  // Emit socket event to notify new participants about the conversation
  try {
    const io = getIO();
    payload.userProfileIds.forEach((userProfileId) => {
      io.to(`user:${userProfileId}`).emit(
        "conversation:new",
        updatedConversation
      );
    });

    // Also notify all existing participants about the update
    updatedConversation.participants.forEach((participant) => {
      io.to(`user:${participant.userProfileId}`).emit(
        "conversation:updated",
        updatedConversation
      );
    });
  } catch (error) {
    console.error(
      "Error emitting conversation:new event for new participants:",
      error
    );
  }

  return updatedConversation;
};

const removeParticipantFromConversation = async (
  conversationId: string,
  participantUserProfileId: string,
  currentUserProfileId: string
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: true,
    },
  });

  if (!conversation) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Conversation not found");
  }

  // Users can remove themselves, or admins can remove others
  const currentParticipant = conversation.participants.find(
    (p) => p.userProfileId === currentUserProfileId
  );

  const canRemove =
    currentUserProfileId === participantUserProfileId ||
    currentParticipant?.isAdmin;

  if (!canRemove) {
    throw new HTTPError(
      httpStatus.FORBIDDEN,
      "Not authorized to remove this participant"
    );
  }

  // For PROJECT conversations, prevent removing project-related participants
  if (conversation.type === "PROJECT" && conversation.projectId) {
    // Get project with all related participants
    const project = await prisma.project.findUnique({
      where: { id: conversation.projectId },
      include: {
        milestones: {
          include: {
            employeeMilestones: {
              select: { userProfileId: true },
            },
          },
        },
        userProfile: { select: { id: true } },
      },
    });

    // Get all admin user profiles
    const adminProfiles = await prisma.userProfile.findMany({
      where: {
        user: { roles: { some: { role: { name: "ADMIN" } } } },
        isDeleted: false,
      },
      select: { id: true },
    });

    // Collect protected participants
    const protectedIds = new Set<string>();

    // Add all admins
    adminProfiles.forEach((admin) => protectedIds.add(admin.id));

    // Add client
    if (project?.userProfile) {
      protectedIds.add(project.userProfile.id);
    }

    // Add assigned employees
    project?.milestones.forEach((milestone) => {
      milestone.employeeMilestones.forEach((emp) => {
        protectedIds.add(emp.userProfileId);
      });
    });

    // Check if participant is protected
    if (protectedIds.has(participantUserProfileId)) {
      throw new HTTPError(
        httpStatus.FORBIDDEN,
        "Cannot remove project-related participants (admins, client, or assigned employees) from project chat"
      );
    }
  }

  await prisma.conversationParticipant.deleteMany({
    where: {
      conversationId,
      userProfileId: participantUserProfileId,
    },
  });

  // Emit socket events for real-time updates
  try {
    const io = getIO();

    // Notify the removed participant
    io.to(`user:${participantUserProfileId}`).emit("conversation:removed", {
      conversationId,
    });

    // Notify all remaining participants about the update
    const updatedConversation = await getSingleConversationFromDB(
      conversationId,
      currentUserProfileId
    );

    updatedConversation.participants.forEach((participant) => {
      io.to(`user:${participant.userProfileId}`).emit(
        "conversation:updated",
        updatedConversation
      );
    });
  } catch (error) {
    console.error("Error emitting participant removal events:", error);
  }

  return { success: true };
};

const editMessageInDB = async (
  messageId: string,
  currentUserProfileId: string,
  content: string
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Message not found");
  }

  if (message.senderId !== currentUserProfileId) {
    throw new HTTPError(
      httpStatus.FORBIDDEN,
      "You can only edit your own messages"
    );
  }

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      content,
      isEdited: true,
    },
    include: {
      sender: {
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
  });

  return {
    ...updatedMessage,
    conversationId: message.conversationId,
  };
};

const deleteMessageFromDB = async (
  messageId: string,
  currentUserProfileId: string
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new HTTPError(httpStatus.NOT_FOUND, "Message not found");
  }

  if (message.senderId !== currentUserProfileId) {
    throw new HTTPError(
      httpStatus.FORBIDDEN,
      "You can only delete your own messages"
    );
  }

  const deletedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      content: "This message has been deleted",
      attachments: Prisma.JsonNull,
    },
  });

  return {
    ...deletedMessage,
    conversationId: message.conversationId,
  };
};

export const ChatService = {
  createConversationIntoDB,
  getUserConversationsFromDB,
  getSingleConversationFromDB,
  getConversationMessagesFromDB,
  getConversationMediaFromDB,
  createMessage,
  ensureConversationParticipant,
  addParticipantsToConversation,
  removeParticipantFromConversation,
  editMessageInDB,
  deleteMessageFromDB,
};
