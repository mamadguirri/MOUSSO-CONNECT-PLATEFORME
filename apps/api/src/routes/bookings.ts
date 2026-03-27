import { Router, Response } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middlewares/auth';

export const bookingRouter = Router();

// Créer une réservation (client)
const createBookingSchema = z.object({
  providerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date: YYYY-MM-DD'),
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format heure: HH:MM'),
  note: z.string().max(500).optional(),
  clientPhone: z.string().regex(/^\+223\d{8}$/, 'Format attendu: +223XXXXXXXX'),
});

bookingRouter.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Vérifier que le service existe et appartient au prestataire
    const service = await prisma.providerService.findFirst({
      where: { id: data.serviceId, providerId: data.providerId },
      include: { category: true },
    });

    if (!service) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service introuvable' },
      });
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        clientId: req.userId!,
        providerId: data.providerId,
        serviceId: data.serviceId,
        requestedDate: new Date(data.requestedDate),
        requestedTime: data.requestedTime,
        note: data.note,
        clientPhone: data.clientPhone,
      },
      include: {
        provider: { include: { user: true } },
        service: { include: { category: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: booking.id,
        providerName: booking.provider.user.name,
        serviceName: booking.service.category.name,
        requestedDate: booking.requestedDate.toISOString().split('T')[0],
        requestedTime: booking.requestedTime,
        status: booking.status,
        note: booking.note,
        createdAt: booking.createdAt.toISOString(),
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

// Mes réservations (client)
bookingRouter.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  const bookings = await prisma.booking.findMany({
    where: { clientId: req.userId! },
    include: {
      provider: { include: { user: true } },
      service: { include: { category: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: bookings.map((b) => ({
      id: b.id,
      providerName: b.provider.user.name,
      providerAvatar: b.provider.avatarUrl,
      serviceName: b.service.category.name,
      requestedDate: b.requestedDate.toISOString().split('T')[0],
      requestedTime: b.requestedTime,
      status: b.status,
      note: b.note,
      rejectionReason: b.rejectionReason,
      createdAt: b.createdAt.toISOString(),
    })),
  });
});

// Réservations reçues (prestataire)
bookingRouter.get('/received', authenticate, requireRole('PROVIDER'), async (req: AuthRequest, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });
  if (!provider) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Profil introuvable' } });
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: { providerId: provider.id },
    include: {
      client: true,
      service: { include: { category: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: bookings.map((b) => ({
      id: b.id,
      clientName: b.client.name,
      clientPhone: b.clientPhone,
      serviceName: b.service.category.name,
      requestedDate: b.requestedDate.toISOString().split('T')[0],
      requestedTime: b.requestedTime,
      status: b.status,
      note: b.note,
      createdAt: b.createdAt.toISOString(),
    })),
  });
});

// Accepter / Refuser une réservation (prestataire)
const updateBookingSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED']),
  rejectionReason: z.string().max(500).optional(),
});

bookingRouter.patch('/:id', authenticate, requireRole('PROVIDER'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, rejectionReason } = updateBookingSchema.parse(req.body);

    const provider = await prisma.provider.findUnique({ where: { userId: req.userId! } });
    if (!provider) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Profil introuvable' } });
      return;
    }

    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, providerId: provider.id },
    });

    if (!booking) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Réservation introuvable' } });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status, rejectionReason: status === 'REJECTED' ? rejectionReason : null },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        message: status === 'ACCEPTED' ? 'Réservation acceptée' : status === 'REJECTED' ? 'Réservation refusée' : 'Réservation terminée',
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

// Annuler une réservation (client)
bookingRouter.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, clientId: req.userId!, status: 'PENDING' },
  });

  if (!booking) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Réservation introuvable ou non annulable' } });
    return;
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'CANCELLED' },
  });

  res.json({ success: true, data: { message: 'Réservation annulée' } });
});
