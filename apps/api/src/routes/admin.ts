import { Router, Response } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middlewares/auth';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('ADMIN'));

// GET /admin/stats - Dashboard enrichi
adminRouter.get('/stats', async (_req: AuthRequest, res: Response) => {
  const [totalUsers, totalProviders, verifiedProviders, pendingProviders, totalBookings, pendingBookings, totalCategories] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.provider.count({ where: { deletedAt: null } }),
    prisma.provider.count({ where: { isVerified: true, deletedAt: null } }),
    prisma.provider.count({ where: { isVerified: false, isSuspended: false, deletedAt: null } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.category.count({ where: { isActive: true } }),
  ]);

  res.json({
    success: true,
    data: { totalUsers, totalProviders, verifiedProviders, pendingProviders, totalBookings, pendingBookings, totalCategories },
  });
});

// GET /admin/providers
const listSchema = z.object({
  status: z.enum(['pending', 'verified', 'suspended']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

adminRouter.get('/providers', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page, limit } = listSchema.parse(req.query);

    const where: Record<string, unknown> = { deletedAt: null };
    if (status === 'pending') {
      where.isVerified = false;
      where.isSuspended = false;
    } else if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'suspended') {
      where.isSuspended = true;
    }

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        include: {
          user: { include: { quartier: true } },
          services: { include: { category: true } },
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
          phone: p.user.phone,
          bio: p.bio,
          avatarUrl: p.avatarUrl,
          whatsappNumber: p.whatsappNumber,
          quartierName: p.user.quartier?.name || null,
          categories: p.services.map((s) => ({
            name: s.category.name,
            slug: s.category.slug,
            iconName: s.category.iconName,
          })),
          isVerified: p.isVerified,
          isSuspended: p.isSuspended,
          createdAt: p.createdAt.toISOString(),
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
});

// PATCH /admin/providers/:id/verify
adminRouter.patch('/providers/:id/verify', async (req: AuthRequest, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { id: req.params.id } });
  if (!provider) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Prestataire introuvable' } });
    return;
  }
  await prisma.provider.update({ where: { id: provider.id }, data: { isVerified: true } });
  res.json({ success: true, data: { message: 'Prestataire vérifié' } });
});

// PATCH /admin/providers/:id/suspend
const suspendSchema = z.object({ suspended: z.boolean() });

adminRouter.patch('/providers/:id/suspend', async (req: AuthRequest, res: Response) => {
  try {
    const { suspended } = suspendSchema.parse(req.body);
    const provider = await prisma.provider.findUnique({ where: { id: req.params.id } });
    if (!provider) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Prestataire introuvable' } });
      return;
    }
    await prisma.provider.update({ where: { id: provider.id }, data: { isSuspended: suspended } });
    res.json({ success: true, data: { message: suspended ? 'Prestataire suspendu' : 'Prestataire réactivé' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
      return;
    }
    throw error;
  }
});

// ==================== CATEGORIES CRUD ====================

const createCategorySchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  iconName: z.string().min(1, "Nom d'icône requis"),
});

// GET /admin/categories
adminRouter.get('/categories', async (_req: AuthRequest, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { services: true } } },
  });
  res.json({
    success: true,
    data: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      iconName: c.iconName,
      isActive: c.isActive,
      providerCount: c._count.services,
      createdAt: c.createdAt.toISOString(),
    })),
  });
});

// POST /admin/categories
adminRouter.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { name, iconName } = createCategorySchema.parse(req.body);
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      res.status(400).json({ success: false, error: { code: 'ALREADY_EXISTS', message: 'Cette catégorie existe déjà' } });
      return;
    }

    const category = await prisma.category.create({
      data: { name, slug, iconName },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
      return;
    }
    throw error;
  }
});

// PUT /admin/categories/:id
adminRouter.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, iconName } = createCategorySchema.parse(req.body);
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!category) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Catégorie introuvable' } });
      return;
    }

    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const updated = await prisma.category.update({
      where: { id: category.id },
      data: { name, slug, iconName },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
      return;
    }
    throw error;
  }
});

// PATCH /admin/categories/:id/toggle
adminRouter.patch('/categories/:id/toggle', async (req: AuthRequest, res: Response) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Catégorie introuvable' } });
    return;
  }
  const updated = await prisma.category.update({
    where: { id: category.id },
    data: { isActive: !category.isActive },
  });
  res.json({ success: true, data: { isActive: updated.isActive, message: updated.isActive ? 'Catégorie activée' : 'Catégorie désactivée' } });
});

// ==================== USERS MANAGEMENT ====================

const userListSchema = z.object({
  role: z.enum(['CLIENT', 'PROVIDER', 'ADMIN']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

adminRouter.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { role, page, limit } = userListSchema.parse(req.query);

    const where: Record<string, unknown> = { deletedAt: null };
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { quartier: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          id: u.id,
          phone: u.phone,
          name: u.name,
          role: u.role,
          accountType: u.accountType,
          quartierName: u.quartier?.name || null,
          isActive: u.isActive,
          createdAt: u.createdAt.toISOString(),
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
      return;
    }
    throw error;
  }
});

// PATCH /admin/users/:id/toggle - Activer/désactiver un utilisateur
adminRouter.patch('/users/:id/toggle', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Utilisateur introuvable' } });
    return;
  }
  if (user.role === 'ADMIN') {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Impossible de modifier un admin' } });
    return;
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isActive: !user.isActive },
  });
  res.json({ success: true, data: { isActive: updated.isActive, message: updated.isActive ? 'Utilisateur activé' : 'Utilisateur désactivé' } });
});

// ==================== BOOKINGS MANAGEMENT ====================

const bookingListSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

adminRouter.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page, limit } = bookingListSchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          client: true,
          provider: { include: { user: true } },
          service: { include: { category: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings: bookings.map((b) => ({
          id: b.id,
          clientName: b.client.name,
          clientPhone: b.clientPhone,
          providerName: b.provider.user.name,
          serviceName: b.service.category.name,
          requestedDate: b.requestedDate.toISOString().split('T')[0],
          requestedTime: b.requestedTime,
          status: b.status,
          note: b.note,
          createdAt: b.createdAt.toISOString(),
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
      return;
    }
    throw error;
  }
});
