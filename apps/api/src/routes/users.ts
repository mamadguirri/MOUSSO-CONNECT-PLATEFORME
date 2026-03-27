import { Router, Response } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middlewares/auth';

export const userRouter = Router();

userRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: { quartier: true, provider: true },
  });

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Utilisateur introuvable' },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      accountType: user.accountType,
      quartierId: user.quartierId,
      quartierName: user.quartier?.name || null,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      providerId: user.provider?.id || null,
    },
  });
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  quartierId: z.string().uuid().optional(),
});

userRouter.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data,
      include: { quartier: true },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        quartierId: user.quartierId,
        quartierName: user.quartier?.name || null,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
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
});
