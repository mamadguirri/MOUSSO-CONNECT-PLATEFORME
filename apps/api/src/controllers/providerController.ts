import { Request, Response } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { uploadFile, deleteFile } from '../services/storage';
import { AuthRequest } from '../middlewares/auth';

const listSchema = z.object({
  categorySlug: z.string().optional(),
  quartierId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const createSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(500).optional(),
  whatsappNumber: z.string().regex(/^\+223\d{8}$/, 'Format attendu: +223XXXXXXXX'),
  quartierId: z.string().uuid(),
  categoryIds: z.union([z.string().uuid().transform(v => [v]), z.array(z.string().uuid()).min(1)]),
  priceRange: z.string().optional(),
});

export async function listProviders(req: Request, res: Response) {
  try {
    const { categorySlug, quartierId, page, limit } = listSchema.parse(req.query);

    const where: Record<string, unknown> = {
      isVerified: true,
      isSuspended: false,
      deletedAt: null,
    };

    if (categorySlug) {
      where.services = { some: { category: { slug: categorySlug } } };
    }

    if (quartierId) {
      where.user = { quartierId };
    }

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        include: {
          user: { include: { quartier: true } },
          services: { include: { category: true, photos: { orderBy: { order: 'asc' }, take: 1 } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.provider.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        providers: providers.map((p) => ({
          id: p.id,
          userId: p.userId,
          name: p.user.name,
          bio: p.bio,
          avatarUrl: p.avatarUrl,
          quartierName: p.user.quartier?.name || null,
          categories: p.services.map((s) => ({
            name: s.category.name,
            slug: s.category.slug,
            iconName: s.category.iconName,
          })),
          isVerified: p.isVerified,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
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

export async function getProvider(req: Request, res: Response) {
  const provider = await prisma.provider.findUnique({
    where: { id: req.params.id },
    include: {
      user: { include: { quartier: true } },
      services: {
        include: {
          category: true,
          photos: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!provider || provider.deletedAt) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Prestataire introuvable' },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      id: provider.id,
      userId: provider.userId,
      name: provider.user.name,
      bio: provider.bio,
      avatarUrl: provider.avatarUrl,
      whatsappNumber: provider.whatsappNumber,
      quartierName: provider.user.quartier?.name || null,
      services: provider.services.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        categoryName: s.category.name,
        categorySlug: s.category.slug,
        iconName: s.category.iconName,
        description: s.description,
        priceRange: s.priceRange,
        photos: s.photos.map((ph) => ({
          id: ph.id,
          url: ph.url,
          order: ph.order,
        })),
      })),
      // Backward compat: flat categories list
      categories: provider.services.map((s) => ({
        name: s.category.name,
        slug: s.category.slug,
        iconName: s.category.iconName,
        priceRange: s.priceRange,
      })),
      // Flat photos for backward compat
      photos: provider.services.flatMap((s) => s.photos.map((ph) => ({
        id: ph.id,
        url: ph.url,
        order: ph.order,
      }))),
      isVerified: provider.isVerified,
      createdAt: provider.createdAt.toISOString(),
    },
  });
}

export async function createProvider(req: AuthRequest, res: Response) {
  try {
    const data = createSchema.parse(req.body);

    const existingProvider = await prisma.provider.findUnique({
      where: { userId: req.userId! },
    });

    if (existingProvider) {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_EXISTS', message: 'Vous avez déjà un profil prestataire' },
      });
      return;
    }

    let avatarUrl: string | null = null;
    if (req.file) {
      avatarUrl = await uploadFile(req.file.buffer, req.file.mimetype, 'avatars');
    }

    const provider = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.userId! },
        data: { name: data.name, quartierId: data.quartierId, role: 'PROVIDER', accountType: 'PROVIDER' },
      });

      return tx.provider.create({
        data: {
          userId: req.userId!,
          bio: data.bio,
          avatarUrl,
          whatsappNumber: data.whatsappNumber,
          services: {
            create: data.categoryIds.map((categoryId) => ({
              categoryId,
              priceRange: data.priceRange || null,
            })),
          },
        },
        include: {
          user: { include: { quartier: true } },
          services: { include: { category: true } },
        },
      });
    });

    res.status(201).json({
      success: true,
      data: {
        id: provider.id,
        userId: provider.userId,
        name: provider.user.name,
        bio: provider.bio,
        avatarUrl: provider.avatarUrl,
        whatsappNumber: provider.whatsappNumber,
        quartierName: provider.user.quartier?.name || null,
        categories: provider.services.map((s) => ({
          name: s.category.name,
          slug: s.category.slug,
          iconName: s.category.iconName,
          priceRange: s.priceRange,
        })),
        isVerified: provider.isVerified,
        createdAt: provider.createdAt.toISOString(),
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

export async function updateProvider(req: AuthRequest, res: Response) {
  try {
    const provider = await prisma.provider.findUnique({
      where: { userId: req.userId! },
    });

    if (!provider) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profil prestataire introuvable' },
      });
      return;
    }

    let avatarUrl = provider.avatarUrl;
    if (req.file) {
      if (provider.avatarUrl) {
        await deleteFile(provider.avatarUrl);
      }
      avatarUrl = await uploadFile(req.file.buffer, req.file.mimetype, 'avatars');
    }

    const updateData: Record<string, unknown> = {};
    if (req.body.bio !== undefined) updateData.bio = req.body.bio;
    if (req.body.whatsappNumber) updateData.whatsappNumber = req.body.whatsappNumber;
    if (avatarUrl !== provider.avatarUrl) updateData.avatarUrl = avatarUrl;

    const updated = await prisma.$transaction(async (tx) => {
      if (req.body.name || req.body.quartierId) {
        const userData: Record<string, unknown> = {};
        if (req.body.name) userData.name = req.body.name;
        if (req.body.quartierId) userData.quartierId = req.body.quartierId;
        await tx.user.update({ where: { id: req.userId! }, data: userData });
      }

      if (req.body.categoryIds) {
        const categoryIds = Array.isArray(req.body.categoryIds) ? req.body.categoryIds : [req.body.categoryIds];
        await tx.providerService.deleteMany({ where: { providerId: provider.id } });
        await tx.providerService.createMany({
          data: categoryIds.map((categoryId: string) => ({
            providerId: provider.id,
            categoryId,
            priceRange: req.body.priceRange || null,
          })),
        });
      }

      return tx.provider.update({
        where: { id: provider.id },
        data: updateData,
        include: {
          user: { include: { quartier: true } },
          services: { include: { category: true, photos: { orderBy: { order: 'asc' } } } },
        },
      });
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        name: updated.user.name,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        whatsappNumber: updated.whatsappNumber,
        quartierName: updated.user.quartier?.name || null,
        services: updated.services.map((s) => ({
          id: s.id,
          categoryName: s.category.name,
          categorySlug: s.category.slug,
          priceRange: s.priceRange,
          photos: s.photos.map((ph) => ({ id: ph.id, url: ph.url, order: ph.order })),
        })),
        categories: updated.services.map((s) => ({
          name: s.category.name,
          slug: s.category.slug,
          iconName: s.category.iconName,
          priceRange: s.priceRange,
        })),
        isVerified: updated.isVerified,
        createdAt: updated.createdAt.toISOString(),
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

// POST /providers/me/services/:serviceId/photos - Ajouter des photos à un service
export async function addServicePhotos(req: AuthRequest, res: Response) {
  const provider = await prisma.provider.findUnique({
    where: { userId: req.userId! },
  });

  if (!provider) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Profil prestataire introuvable' },
    });
    return;
  }

  const service = await prisma.providerService.findFirst({
    where: { id: req.params.serviceId, providerId: provider.id },
    include: { photos: true },
  });

  if (!service) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Service introuvable' },
    });
    return;
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Aucune photo fournie' },
    });
    return;
  }

  if (service.photos.length + files.length > 10) {
    res.status(400).json({
      success: false,
      error: { code: 'LIMIT_EXCEEDED', message: 'Maximum 10 photos par service' },
    });
    return;
  }

  const photos = [];
  const startOrder = service.photos.length;

  for (let i = 0; i < files.length; i++) {
    const url = await uploadFile(files[i].buffer, files[i].mimetype, 'gallery');
    const photo = await prisma.servicePhoto.create({
      data: {
        serviceId: service.id,
        url,
        order: startOrder + i,
      },
    });
    photos.push({ id: photo.id, url: photo.url, order: photo.order });
  }

  res.status(201).json({ success: true, data: { photos } });
}

// DELETE /providers/me/services/:serviceId/photos/:photoId
export async function deleteServicePhoto(req: AuthRequest, res: Response) {
  const provider = await prisma.provider.findUnique({
    where: { userId: req.userId! },
  });

  if (!provider) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Profil prestataire introuvable' },
    });
    return;
  }

  const photo = await prisma.servicePhoto.findFirst({
    where: {
      id: req.params.photoId,
      service: { providerId: provider.id, id: req.params.serviceId },
    },
  });

  if (!photo) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Photo introuvable' },
    });
    return;
  }

  await deleteFile(photo.url);
  await prisma.servicePhoto.delete({ where: { id: photo.id } });

  res.json({ success: true, data: { message: 'Photo supprimée' } });
}

// PUT /providers/me/services/:serviceId - Mettre à jour un service
export async function updateService(req: AuthRequest, res: Response) {
  try {
    const provider = await prisma.provider.findUnique({
      where: { userId: req.userId! },
    });

    if (!provider) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profil prestataire introuvable' },
      });
      return;
    }

    const service = await prisma.providerService.findFirst({
      where: { id: req.params.serviceId, providerId: provider.id },
    });

    if (!service) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service introuvable' },
      });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.priceRange !== undefined) updateData.priceRange = req.body.priceRange;

    const updated = await prisma.providerService.update({
      where: { id: service.id },
      data: updateData,
      include: { category: true, photos: { orderBy: { order: 'asc' } } },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        categoryName: updated.category.name,
        description: updated.description,
        priceRange: updated.priceRange,
        photos: updated.photos.map((ph) => ({ id: ph.id, url: ph.url, order: ph.order })),
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
