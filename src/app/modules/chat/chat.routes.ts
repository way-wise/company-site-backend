import express from "express";
import authGuard from "../../middlewares/authGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { fileUploader } from "../../../helpers/fileUploader";
import { ChatController } from "./chat.controller";
import { chatValidationSchemas } from "./chat.validationSchema";

const router = express.Router();

// All chat routes require authentication
router.use(authGuard());

// Conversation routes
router.post(
  "/conversations",
  validateRequest(chatValidationSchemas.createConversation),
  ChatController.createConversation
);

router.get("/conversations", ChatController.getUserConversations);

router.get("/conversations/:id", ChatController.getSingleConversation);

router.get(
  "/conversations/:id/messages",
  ChatController.getConversationMessages
);

router.get("/conversations/:id/media", ChatController.getConversationMedia);

router.post(
  "/conversations/:id/messages",
  fileUploader.upload.array("files", 5),
  ChatController.createMessage
);

router.post(
  "/conversations/:id/participants",
  validateRequest(chatValidationSchemas.addParticipants),
  ChatController.addParticipants
);

router.delete(
  "/conversations/:id/participants/:userProfileId",
  ChatController.removeParticipant
);

router.patch(
  "/conversations/:id/read",
  ChatController.markConversationAsRead
);

// Message routes
router.patch(
  "/messages/:id",
  validateRequest(chatValidationSchemas.editMessage),
  ChatController.editMessage
);

router.delete("/messages/:id", ChatController.deleteMessage);

export const ChatRoutes = router;
