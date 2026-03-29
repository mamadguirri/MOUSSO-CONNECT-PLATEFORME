import { Response } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth';
import { notifyNewReview } from '../services/notification';

const createReviewSchema = z.object({
  providerId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// POST /reviews - Laisser un avis
export async function createReview(req: AuthRequest, res: Response) {
  try {
    const data = createReviewSchema.parse(req.body);

    // Vérifier que le provider existe
    const provider = await prisma.provider.findUnique({ where: { id: data.providerId } });
    if (!provider) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Prestataire introuvable' },
      });
      return;
    }

    // Ne pas se noter soi-même
    if (provider.userId === req.userId) {
      res.status(400).json({
        success: false,
        error: { code: 'SELF_REVIEW', message: 'Vous ne pouvez pas vous noter vous-même' },
      });
      return;
    }

    // Créer ou mettre à jour l'avis (un seul avis par client par prestataire)
    const review = await prisma.review.upsert({
      where: {
        clientId_providerId: {
          clientId: req.userId!,
          providerId: data.providerId,
        },
      },
      update: {
        rating: data.rating,
        comment: data.comment || null,
      },
      create: {
        clientId: req.userId!,
        providerId: data.providerId,
        rating: data.rating,
        comment: data.comment || null,
      },
      include: {
        client: { select: { name: true } },
      },
    });

    // Notification au prestataire
    notifyNewReview(provider.userId, review.client.name, review.rating, provider.id).catch(() => {});

    res.status(201).json({
      success: true,
      data: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        clientName: review.client.name,
        createdAt: review.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message },
      });
      return;
    }
    throw error;
  }
}

// GET /reviews/:providerId - Récupérer les avis d'une prestataire
export async function getProviderReviews(req: AuthRequest, res: Response) {
  const { providerId } = req.params;

  const reviews = await prisma.review.findMany({
    where: { providerId },
    include: {
      client: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculer la moyenne
  const total = reviews.length;
  const avgRating = total > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
    : 0;

  res.json({
    success: true,
    data: {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        clientName: r.client.name,
        createdAt: r.createdAt.toISOString(),
      })),
      averageRating: avgRating,
      totalReviews: total,
    },
  });
}
