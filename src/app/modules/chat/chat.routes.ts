import express from "express";
import authGuard from "../../middlewares/authGuard";
import { validateRequest } from "../../middlewares/validateRequest";
import { fileUploader } from "../../../helpers/fileUploader";
import { ChatController } from "./chat.controller";
import { chatValidationSchemas } from "./chat.validationSchema";

const router = express.Router();

// All chat routes require authentication
router.use(authGuard());

/**
 * @swagger
 * /api/v1/chat/conversations:
 *   post:
 *     tags: [Chat]
 *     summary: Create conversation
 *     description: Create a new conversation (direct or group). Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [DIRECT, GROUP, PROJECT]
 *               name:
 *                 type: string
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags: [Chat]
 *     summary: Get user conversations
 *     description: Get all conversations for the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Conversations fetched successfully
 *       401:
 *         description: Unauthorized
 * /api/v1/chat/conversations/{id}:
 *   get:
 *     tags: [Chat]
 *     summary: Get single conversation
 *     description: Get a single conversation by ID. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 * /api/v1/chat/conversations/{id}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Get conversation messages
 *     description: Get all messages for a conversation. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *   post:
 *     tags: [Chat]
 *     summary: Create message
 *     description: Send a message in a conversation (supports file attachments). Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 * /api/v1/chat/conversations/{id}/media:
 *   get:
 *     tags: [Chat]
 *     summary: Get conversation media
 *     description: Get all media files from a conversation. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 * /api/v1/chat/conversations/{id}/participants:
 *   post:
 *     tags: [Chat]
 *     summary: Add participants
 *     description: Add participants to a conversation. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userProfileIds
 *             properties:
 *               userProfileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Participants added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 * /api/v1/chat/conversations/{id}/participants/{userProfileId}:
 *   delete:
 *     tags: [Chat]
 *     summary: Remove participant
 *     description: Remove a participant from a conversation. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userProfileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participant removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation or participant not found
 * /api/v1/chat/messages/{id}:
 *   patch:
 *     tags: [Chat]
 *     summary: Edit message
 *     description: Edit a message. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message edited successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only edit own messages
 *       404:
 *         description: Message not found
 *   delete:
 *     tags: [Chat]
 *     summary: Delete message
 *     description: Delete a message. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Can only delete own messages
 *       404:
 *         description: Message not found
 */
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
  "/messages/:id",
  validateRequest(chatValidationSchemas.editMessage),
  ChatController.editMessage
);

router.delete("/messages/:id", ChatController.deleteMessage);

export const ChatRoutes = router;
