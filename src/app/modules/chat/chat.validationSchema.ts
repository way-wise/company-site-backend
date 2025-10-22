import { z } from "zod";

const createConversation = z.object({
  body: z.object({
    type: z.enum(["DIRECT", "GROUP", "PROJECT"]),
    name: z.string().optional(),
    projectId: z.string().optional(),
    participantIds: z
      .array(z.string())
      .min(1, "At least one participant is required"),
  }),
});

const addParticipants = z.object({
  body: z.object({
    userProfileIds: z
      .array(z.string())
      .min(1, "At least one participant is required"),
  }),
});

const editMessage = z.object({
  body: z.object({
    content: z.string().min(1, "Message content is required"),
  }),
});

export const chatValidationSchemas = {
  createConversation,
  addParticipants,
  editMessage,
};
