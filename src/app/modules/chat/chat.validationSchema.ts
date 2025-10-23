import { z } from "zod";

const createConversation = z.object({
  body: z.object({
    type: z.enum(["DIRECT", "GROUP", "PROJECT"], {
      message: "Type must be DIRECT, GROUP, or PROJECT",
    }),
    name: z.string().optional(),
    projectId: z.string().optional(),
    participantIds: z.array(z.string()).default([]),
  }),
});

const addParticipants = z.object({
  body: z.object({
    userProfileIds: z
      .array(z.string())
      .min(1, { message: "At least one user profile ID is required" }),
  }),
});

const editMessage = z.object({
  body: z.object({
    content: z
      .string()
      .min(1, { message: "Message content cannot be empty" })
      .max(5000, { message: "Message content is too long" }),
  }),
});

export const chatValidationSchemas = {
  createConversation,
  addParticipants,
  editMessage,
};
