import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import { HTTPError } from "../../errors/HTTPError";
import {
  IPaginationParams,
  ISortingParams,
} from "../../interfaces/paginationSorting";
import { searchableFields } from "./chat.constants";
import {
  IAddParticipantsPayload,
  IConversationFilterParams,
  ICreateConversationPayload,
} from "./chat.interface";

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

  // If PROJECT type, verify project exists
  if (type === "PROJECT" && projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new HTTPError(httpStatus.NOT_FOUND, "Project not found");
    }
  }

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
          ...participantIds.map((id: string) => ({
            userProfileId: id,
            isAdmin: type === "DIRECT", // In DIRECT chats, both are admins
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

  return conversation;
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

  // Add new participants
  await prisma.conversationParticipant.createMany({
    data: payload.userProfileIds.map((userProfileId) => ({
      conversationId,
      userProfileId,
    })),
    skipDuplicates: true,
  });

  return await getSingleConversationFromDB(
    conversationId,
    currentUserProfileId
  );
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

  await prisma.conversationParticipant.deleteMany({
    where: {
      conversationId,
      userProfileId: participantUserProfileId,
    },
  });

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

  return await prisma.message.update({
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

  return await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      content: "This message has been deleted",
    },
  });
};

export const ChatService = {
  createConversationIntoDB,
  getUserConversationsFromDB,
  getSingleConversationFromDB,
  getConversationMessagesFromDB,
  addParticipantsToConversation,
  removeParticipantFromConversation,
  editMessageInDB,
  deleteMessageFromDB,
};
