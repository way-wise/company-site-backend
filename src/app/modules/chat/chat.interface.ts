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
