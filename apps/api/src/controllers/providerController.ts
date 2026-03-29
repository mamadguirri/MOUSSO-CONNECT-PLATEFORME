import { Request, Response } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { uploadFile, deleteFile } from '../services/storage';
import { AuthRequest } from '../middlewares/auth';

const listSchema = z.object({
  q: z.string().optional(),
  categorySlug: z.string().optional(),
  quartierId: z.string().uuid().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(50).default(10),
  categorySlug: z.string().optional(),
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

// Calcule la distance Haversine en km entre deux points GPS
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function listProviders(req: Request, res: Response) {
  try {
    const { q, categorySlug, quartierId, lat, lng, page, limit } = listSchema.parse(req.query);

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

    // Recherche texte libre : nom, bio, quartier, catégorie
    if (q && q.trim()) {
      const search = q.trim();
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { bio: { contains: search, mode: 'insensitive' } },
        { user: { quartier: { name: { contains: search, mode: 'insensitive' } } } },
        { user: { quartier: { ville: { contains: search, mode: 'insensitive' } } } },
        { user: { quartier: { region: { contains: search, mode: 'insensitive' } } } },
        { services: { some: { category: { name: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        include: {
          user: { include: { quartier: true } },
          services: { include: { category: true, photos: { orderBy: { order: 'asc' }, take: 1 } } },
          reviews: { select: { rating: true } },
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
        providers: providers.map((p) => {
          let distance: number | null = null;
          if (lat != null && lng != null) {
            const pLat = p.latitude ?? p.user.quartier?.latitude;
            const pLng = p.longitude ?? p.user.quartier?.longitude;
            if (pLat != null && pLng != null) {
              distance = Math.round(haversineDistance(lat, lng, pLat, pLng) * 10) / 10;
            }
          }
          const totalReviews = p.reviews?.length || 0;
          const avgRating = totalReviews > 0
            ? Math.round((p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews) * 10) / 10
            : null;

          return {
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
            distance,
            averageRating: avgRating,
            totalReviews,
          };
        }),
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

// GET /providers/nearby?lat=X&lng=Y&radius=10
export async function listProvidersNearby(req: Request, res: Response) {
  try {
    const { lat, lng, radius, categorySlug, page, limit } = nearbySchema.parse(req.query);

    const where: Record<string, unknown> = {
      isVerified: true,
      isSuspended: false,
      deletedAt: null,
    };

    if (categorySlug) {
      where.services = { some: { category: { slug: categorySlug } } };
    }

    // Récupérer tous les providers vérifiés (dans le rayon approximatif)
    const allProviders = await prisma.provider.findMany({
      where,
      include: {
        user: { include: { quartier: true } },
        services: { include: { category: true, photos: { orderBy: { order: 'asc' }, take: 1 } } },
        reviews: { select: { rating: true } },
      },
    });

    // Calculer la distance et filtrer par rayon
    const withDistance = allProviders
      .map((p) => {
        const pLat = p.latitude ?? p.user.quartier?.latitude;
        const pLng = p.longitude ?? p.user.quartier?.longitude;
        if (pLat == null || pLng == null) return null;
        const distance = haversineDistance(lat, lng, pLat, pLng);
        return { provider: p, distance: Math.round(distance * 10) / 10 };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    const total = withDistance.length;
    const paginated = withDistance.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        providers: paginated.map(({ provider: p, distance }) => {
          const totalReviews = p.reviews?.length || 0;
          const avgRating = totalReviews > 0
            ? Math.round((p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews) * 10) / 10
            : null;
          return {
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
            distance,
            averageRating: avgRating,
            totalReviews,
          };
        }),
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
      reviews: { select: { rating: true } },
    },
  });

  if (!provider || provider.deletedAt) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Prestataire introuvable' },
    });
    return;
  }

  // Calcul note moyenne
  const totalReviews = provider.reviews.length;
  const averageRating = totalReviews > 0
    ? Math.round((provider.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
    : null;

  res.json({
    success: true,
    data: {
      id: provider.id,
      userId: provider.userId,
      name: provider.user.name,
      bio: provider.bio,
      avatarUrl: provider.avatarUrl,
      whatsappNumber: provider.whatsappNumber,
      quartierId: provider.user.quartierId || null,
      quartierName: provider.user.quartier?.name || null,
      latitude: provider.latitude || provider.user.quartier?.latitude || null,
      longitude: provider.longitude || provider.user.quartier?.longitude || null,
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
      averageRating,
      totalReviews,
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
