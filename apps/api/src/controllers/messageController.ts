import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../lib/prisma';
import { uploadFile } from '../services/storage';

// Liste des conversations de l'utilisateur connecté
export async function getConversations(req: AuthRequest, res: Response) {
  const userId = req.userId!;

  // Trouver le providerId de l'utilisateur s'il est prestataire
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { provider: true },
  });

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { clientId: userId },
        ...(user?.provider ? [{ providerId: user.provider.id }] : []),
      ],
    },
    include: {
      client: { select: { id: true, name: true } },
      provider: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  // Compter les messages non lus par conversation
  const data = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          isRead: false,
        },
      });

      const lastMessage = conv.messages[0] || null;
      const isProvider = user?.provider?.id === conv.providerId;

      return {
        id: conv.id,
        otherUser: isProvider
          ? { id: conv.client.id, name: conv.client.name }
          : { id: conv.provider.user.id, name: conv.provider.user.name },
        otherAvatar: isProvider ? null : conv.provider.avatarUrl,
        lastMessage: lastMessage
          ? {
              type: lastMessage.type,
              content: lastMessage.content,
              fileName: lastMessage.fileName,
              duration: lastMessage.duration,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt.toISOString(),
            }
          : null,
        unreadCount,
        updatedAt: conv.lastMessageAt.toISOString(),
      };
    })
  );

  res.json({ success: true, data });
}

// Créer ou récupérer une conversation
export async function getOrCreateConversation(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { providerId } = req.body;

  if (!providerId) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'providerId requis' },
    });
    return;
  }

  // Vérifier que le provider existe
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: { user: true },
  });

  if (!provider) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Prestataire introuvable' },
    });
    return;
  }

  // On ne peut pas s'envoyer un message à soi-même
  if (provider.userId === userId) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID', message: 'Vous ne pouvez pas vous envoyer de message' },
    });
    return;
  }

  // Chercher ou créer la conversation
  let conversation = await prisma.conversation.findUnique({
    where: {
      clientId_providerId: { clientId: userId, providerId },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { clientId: userId, providerId },
    });
  }

  res.json({ success: true, data: { conversationId: conversation.id } });
}

// Récupérer les messages d'une conversation
export async function getMessages(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { conversationId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  // Vérifier que l'utilisateur fait partie de la conversation
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { provider: true },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      client: { select: { id: true, name: true } },
      provider: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!conversation) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Conversation introuvable' },
    });
    return;
  }

  const isClient = conversation.clientId === userId;
  const isProvider = user?.provider?.id === conversation.providerId;

  if (!isClient && !isProvider) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Accès refusé' },
    });
    return;
  }

  // Marquer les messages comme lus
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });

  const total = await prisma.message.count({ where: { conversationId } });
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  res.json({
    success: true,
    data: {
      conversation: {
        id: conversation.id,
        otherUser: isProvider
          ? { id: conversation.client.id, name: conversation.client.name }
          : { id: conversation.provider.user.id, name: conversation.provider.user.name },
        otherAvatar: isProvider ? null : conversation.provider.avatarUrl,
      },
      messages: messages.reverse().map((m) => ({
        id: m.id,
        senderId: m.senderId,
        type: m.type,
        content: m.content,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        duration: m.duration,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// Envoyer un message texte
export async function sendMessage(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { conversationId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Le message ne peut pas être vide' },
    });
    return;
  }

  const access = await verifyConversationAccess(userId, conversationId);
  if (!access) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Accès refusé' },
    });
    return;
  }

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        type: 'TEXT',
        content: content.trim(),
      },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
    return msg;
  });

  res.json({
    success: true,
    data: {
      id: message.id,
      senderId: message.senderId,
      type: message.type,
      content: message.content,
      fileUrl: null,
      fileName: null,
      duration: null,
      isRead: false,
      createdAt: message.createdAt.toISOString(),
    },
  });
}

// Envoyer un fichier (image, vocal, document)
export async function sendFile(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { conversationId } = req.params;
  const messageType = (req.body.type as string) || 'FILE';

  if (!req.file) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Aucun fichier' },
    });
    return;
  }

  const access = await verifyConversationAccess(userId, conversationId);
  if (!access) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Accès refusé' },
    });
    return;
  }

  const folder = messageType === 'VOICE' ? 'voices' : messageType === 'IMAGE' ? 'messages' : 'files';
  const fileUrl = await uploadFile(req.file.buffer, req.file.mimetype, folder);

  const duration = req.body.duration ? parseInt(req.body.duration) : null;

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        type: messageType as any,
        content: messageType === 'IMAGE' ? '📷 Photo' : messageType === 'VOICE' ? '🎤 Message vocal' : `📎 ${req.file!.originalname}`,
        fileUrl,
        fileName: req.file!.originalname,
        duration,
      },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
    return msg;
  });

  res.json({
    success: true,
    data: {
      id: message.id,
      senderId: message.senderId,
      type: message.type,
      content: message.content,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      duration: message.duration,
      isRead: false,
      createdAt: message.createdAt.toISOString(),
    },
  });
}

// Compter les messages non lus au total
export async function getUnreadCount(req: AuthRequest, res: Response) {
  const userId = req.userId!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { provider: true },
  });

  const count = await prisma.message.count({
    where: {
      senderId: { not: userId },
      isRead: false,
      conversation: {
        OR: [
          { clientId: userId },
          ...(user?.provider ? [{ providerId: user.provider.id }] : []),
        ],
      },
    },
  });

  res.json({ success: true, data: { unreadCount: count } });
}

// Helper: vérifier l'accès à une conversation
async function verifyConversationAccess(userId: string, conversationId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { provider: true },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) return false;

  return conversation.clientId === userId || user?.provider?.id === conversation.providerId;
}
