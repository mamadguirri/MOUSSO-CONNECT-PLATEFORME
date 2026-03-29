import { Request, Response } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth';
import { notifyFormationPurchase } from '../services/notification';

// === SCHEMAS ===

const createFormationSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().int().min(0),
});

const updateFormationSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

const createModuleSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  order: z.coerce.number().int().min(0).optional(),
});

const addMediaSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
  url: z.string().url(),
  name: z.string().max(200).optional(),
  order: z.coerce.number().int().min(0).optional(),
});

// === FORMATIONS ===

// GET /formations - Liste publique des formations publiées
export async function listFormations(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const q = (req.query.q as string || '').trim();

  const where: any = { isPublished: true };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { provider: { user: { name: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  const [formations, total] = await Promise.all([
    prisma.formation.findMany({
      where,
      include: {
        provider: {
          include: { user: { select: { name: true, quartier: { select: { name: true } } } } },
        },
        modules: { select: { id: true } },
        purchases: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.formation.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      formations: formations.map((f) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        price: f.price,
        coverUrl: f.coverUrl,
        providerName: f.provider.user.name,
        providerAvatarUrl: f.provider.avatarUrl,
        quartierName: f.provider.user.quartier?.name || null,
        totalModules: f.modules.length,
        totalStudents: f.purchases.length,
        createdAt: f.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// GET /formations/:id - Détail d'une formation (public: info + modules sans média, acheteur: tout)
export async function getFormation(req: AuthRequest, res: Response) {
  const formation = await prisma.formation.findUnique({
    where: { id: req.params.id },
    include: {
      provider: {
        include: { user: { select: { name: true, quartier: { select: { name: true } } } } },
      },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          medias: { orderBy: { order: 'asc' } },
        },
      },
      purchases: { select: { clientId: true } },
    },
  });

  if (!formation || (!formation.isPublished && formation.provider.userId !== req.userId)) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Formation introuvable' },
    });
    return;
  }

  // Vérifier si l'utilisateur a acheté ou est le créateur
  const isOwner = req.userId === formation.provider.userId;
  const hasPurchased = req.userId ? formation.purchases.some((p) => p.clientId === req.userId) : false;
  const hasAccess = isOwner || hasPurchased;

  res.json({
    success: true,
    data: {
      id: formation.id,
      title: formation.title,
      description: formation.description,
      price: formation.price,
      coverUrl: formation.coverUrl,
      isPublished: formation.isPublished,
      providerName: formation.provider.user.name,
      providerAvatarUrl: formation.provider.avatarUrl,
      providerId: formation.providerId,
      quartierName: formation.provider.user.quartier?.name || null,
      totalStudents: formation.purchases.length,
      hasAccess,
      isOwner,
      modules: formation.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        order: m.order,
        // Les médias ne sont visibles que si l'utilisateur a accès
        medias: hasAccess
          ? m.medias.map((media) => ({
              id: media.id,
              type: media.type,
              url: media.url,
              name: media.name,
              order: media.order,
            }))
          : [],
        totalMedias: m.medias.length,
      })),
      createdAt: formation.createdAt.toISOString(),
    },
  });
}

// POST /formations - Créer une formation (PROVIDER only)
export async function createFormation(req: AuthRequest, res: Response) {
  try {
    const data = createFormationSchema.parse(req.body);

    const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });
    if (!provider) {
      res.status(403).json({
        success: false,
        error: { code: 'NOT_PROVIDER', message: 'Vous devez être prestataire pour créer une formation' },
      });
      return;
    }

    const formation = await prisma.formation.create({
      data: {
        providerId: provider.id,
        title: data.title,
        description: data.description || null,
        price: data.price,
      },
    });

    res.status(201).json({ success: true, data: formation });
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

// PUT /formations/:id - Modifier une formation
export async function updateFormation(req: AuthRequest, res: Response) {
  try {
    const data = updateFormationSchema.parse(req.body);

    const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });
    const formation = await prisma.formation.findUnique({ where: { id: req.params.id } });

    if (!formation || !provider || formation.providerId !== provider.id) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Formation introuvable' },
      });
      return;
    }

    const updated = await prisma.formation.update({
      where: { id: formation.id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
    });

    res.json({ success: true, data: updated });
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

// PUT /formations/:id/cover - Upload image de couverture
export async function uploadCover(req: AuthRequest, res: Response) {
  const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });
  const formation = await prisma.formation.findUnique({ where: { id: req.params.id } });

  if (!formation || !provider || formation.providerId !== provider.id) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Formation introuvable' } });
    return;
  }

  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Aucun fichier envoyé' } });
    return;
  }

  const { uploadFile } = await import('../services/storage');
  const url = await uploadFile(req.file.buffer, req.file.mimetype, 'formations');

  await prisma.formation.update({
    where: { id: formation.id },
    data: { coverUrl: url },
  });

  res.json({ success: true, data: { coverUrl: url } });
}

// DELETE /formations/:id
export async function deleteFormation(req: AuthRequest, res: Response) {
  const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });
  const formation = await prisma.formation.findUnique({ where: { id: req.params.id } });

  if (!formation || !provider || formation.providerId !== provider.id) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Formation introuvable' } });
    return;
  }

  await prisma.formation.delete({ where: { id: formation.id } });
  res.json({ success: true, message: 'Formation supprimée' });
}

// GET /formations/my - Mes formations (PROVIDER)
export async function myFormations(req: AuthRequest, res: Response) {
  const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });
  if (!provider) {
    res.json({ success: true, data: [] });
    return;
  }

  const formations = await prisma.formation.findMany({
    where: { providerId: provider.id },
    include: {
      modules: { select: { id: true } },
      purchases: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: formations.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      price: f.price,
      coverUrl: f.coverUrl,
      isPublished: f.isPublished,
      totalModules: f.modules.length,
      totalStudents: f.purchases.length,
      createdAt: f.createdAt.toISOString(),
    })),
  });
}

// === MODULES ===

// POST /formations/:id/modules
export async function addModule(req: AuthRequest, res: Response) {
  try {
    const data = createModuleSchema.parse(req.body);
    const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });
    const formation = await prisma.formation.findUnique({
      where: { id: req.params.id },
      include: { modules: { select: { order: true }, orderBy: { order: 'desc' }, take: 1 } },
    });

    if (!formation || !provider || formation.providerId !== provider.id) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Formation introuvable' } });
      return;
    }

    const nextOrder = data.order ?? ((formation.modules[0]?.order ?? -1) + 1);

    const module = await prisma.formationModule.create({
      data: {
        formationId: formation.id,
        title: data.title,
        description: data.description || null,
        order: nextOrder,
      },
    });

    res.status(201).json({ success: true, data: module });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
      return;
    }
    throw error;
  }
}

// PUT /formations/modules/:moduleId
export async function updateModule(req: AuthRequest, res: Response) {
  try {
    const data = createModuleSchema.parse(req.body);
    const module = await prisma.formationModule.findUnique({
      where: { id: req.params.moduleId },
      include: { formation: true },
    });

    const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });

    if (!module || !provider || module.formation.providerId !== provider.id) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Module introuvable' } });
      return;
    }

    const updated = await prisma.formationModule.update({
      where: { id: module.id },
      data: { title: data.title, description: data.description || null, order: data.order ?? module.order },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
      return;
    }
    throw error;
  }
}

// DELETE /formations/modules/:moduleId
export async function deleteModule(req: AuthRequest, res: Response) {
  const module = await prisma.formationModule.findUnique({
    where: { id: req.params.moduleId },
    include: { formation: true },
  });

  const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });

  if (!module || !provider || module.formation.providerId !== provider.id) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Module introuvable' } });
    return;
  }

  await prisma.formationModule.delete({ where: { id: module.id } });
  res.json({ success: true, message: 'Module supprimé' });
}

// === MEDIAS ===

// POST /formations/modules/:moduleId/medias - Upload media
export async function addMedia(req: AuthRequest, res: Response) {
  const module = await prisma.formationModule.findUnique({
    where: { id: req.params.moduleId },
    include: { formation: true, medias: { select: { order: true }, orderBy: { order: 'desc' }, take: 1 } },
  });

  const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });

  if (!module || !provider || module.formation.providerId !== provider.id) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Module introuvable' } });
    return;
  }

  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Aucun fichier envoyé' } });
    return;
  }

  const { uploadFile } = await import('../services/storage');
  const url = await uploadFile(req.file.buffer, req.file.mimetype, 'formations');

  // Déterminer le type
  const mime = req.file.mimetype;
  let type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' = 'DOCUMENT';
  if (mime.startsWith('image/')) type = 'IMAGE';
  else if (mime.startsWith('video/')) type = 'VIDEO';

  const nextOrder = (module.medias[0]?.order ?? -1) + 1;

  const media = await prisma.formationMedia.create({
    data: {
      moduleId: module.id,
      type,
      url,
      name: req.file.originalname,
      order: nextOrder,
    },
  });

  res.status(201).json({ success: true, data: media });
}

// DELETE /formations/medias/:mediaId
export async function deleteMedia(req: AuthRequest, res: Response) {
  const media = await prisma.formationMedia.findUnique({
    where: { id: req.params.mediaId },
    include: { module: { include: { formation: true } } },
  });

  const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });

  if (!media || !provider || media.module.formation.providerId !== provider.id) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Média introuvable' } });
    return;
  }

  await prisma.formationMedia.delete({ where: { id: media.id } });
  res.json({ success: true, message: 'Média supprimé' });
}

// === ACHAT ===

// POST /formations/:id/purchase - "Acheter" une formation (sans paiement)
export async function purchaseFormation(req: AuthRequest, res: Response) {
  const formation = await prisma.formation.findUnique({ where: { id: req.params.id } });

  if (!formation || !formation.isPublished) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Formation introuvable' } });
    return;
  }

  // Vérifier que ce n'est pas le propriétaire
  const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });
  if (provider && provider.id === formation.providerId) {
    res.status(400).json({ success: false, error: { code: 'OWN_FORMATION', message: 'Vous ne pouvez pas acheter votre propre formation' } });
    return;
  }

  // Vérifier si déjà acheté
  const existing = await prisma.formationPurchase.findUnique({
    where: { clientId_formationId: { clientId: req.userId!, formationId: formation.id } },
  });

  if (existing) {
    res.status(400).json({ success: false, error: { code: 'ALREADY_PURCHASED', message: 'Vous avez déjà cette formation' } });
    return;
  }

  const purchase = await prisma.formationPurchase.create({
    data: {
      clientId: req.userId!,
      formationId: formation.id,
      pricePaid: formation.price,
    },
  });

  // Notification au prestataire
  const providerData = await prisma.provider.findUnique({ where: { id: formation.providerId } });
  const buyer = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (providerData && buyer) {
    notifyFormationPurchase(providerData.userId, buyer.name, formation.title, formation.id).catch(() => {});
  }

  res.status(201).json({ success: true, data: purchase });
}

// GET /formations/purchased - Mes formations achetées
export async function myPurchasedFormations(req: AuthRequest, res: Response) {
  const purchases = await prisma.formationPurchase.findMany({
    where: { clientId: req.userId! },
    include: {
      formation: {
        include: {
          provider: { include: { user: { select: { name: true } } } },
          modules: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: purchases.map((p) => ({
      id: p.formation.id,
      title: p.formation.title,
      description: p.formation.description,
      price: p.formation.price,
      coverUrl: p.formation.coverUrl,
      providerName: p.formation.provider.user.name,
      totalModules: p.formation.modules.length,
      purchasedAt: p.createdAt.toISOString(),
    })),
  });
}
