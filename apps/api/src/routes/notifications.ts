import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middlewares/auth';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

// GET /notifications - Lister les notifications de l'utilisateur
notificationRouter.get('/', async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: req.userId! } }),
    prisma.notification.count({ where: { userId: req.userId!, isRead: false } }),
  ]);

  res.json({
    success: true,
    data: {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /notifications/unread-count - Compteur de notifications non lues
notificationRouter.get('/unread-count', async (req: AuthRequest, res: Response) => {
  const unreadCount = await prisma.notification.count({
    where: { userId: req.userId!, isRead: false },
  });
  res.json({ success: true, data: { unreadCount } });
});

// PATCH /notifications/read-all - Marquer toutes comme lues
notificationRouter.patch('/read-all', async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId!, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true, data: { message: 'Toutes les notifications sont lues' } });
});

// PATCH /notifications/:id/read - Marquer une notification comme lue
notificationRouter.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  const notification = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!notification) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification introuvable' } });
    return;
  }
  await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
  });
  res.json({ success: true, data: { message: 'Notification lue' } });
});
