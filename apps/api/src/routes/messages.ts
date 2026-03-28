import { Router } from 'express';

import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  sendFile,
  getUnreadCount,
} from '../controllers/messageController';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

export const messageRouter = Router();

// Toutes les routes nécessitent une authentification
messageRouter.use(authenticate);

// Conversations
messageRouter.get('/conversations', getConversations);
messageRouter.post('/conversations', getOrCreateConversation);
messageRouter.get('/unread-count', getUnreadCount);

// Messages d'une conversation
messageRouter.get('/conversations/:conversationId/messages', getMessages);
messageRouter.post('/conversations/:conversationId/messages', sendMessage);
messageRouter.post('/conversations/:conversationId/files', upload.single('file'), sendFile);
