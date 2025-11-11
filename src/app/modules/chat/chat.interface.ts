import { ConversationType } from "@prisma/client";

export interface IConversationFilterParams {
  q?: string;
  type?: ConversationType;
  projectId?: string;
  userProfileId?: string;
}

export interface ICreateConversationPayload {
  type: ConversationType;
  name?: string;
  projectId?: string;
  participantIds: string[]; // Array of userProfileIds
}

export interface IAddParticipantsPayload {
  userProfileIds: string[];
}

export type ChatAttachmentType = "image" | "document";

export interface IChatAttachment {
  id: string;
  key: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
  type: ChatAttachmentType;
  uploadedAt: string;
}

export interface IConversationMediaItem extends IChatAttachment {
  messageId: string;
  conversationId: string;
  senderId: string;
  messageCreatedAt: string;
}

export interface ICreateMessagePayload {
  content?: string;
  attachments?: IChatAttachment[];
}
