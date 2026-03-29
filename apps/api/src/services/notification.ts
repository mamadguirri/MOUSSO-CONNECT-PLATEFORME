import { prisma } from '../lib/prisma';

type NotificationType =
  | 'BOOKING_NEW'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED'
  | 'FORMATION_PURCHASE'
  | 'REVIEW_NEW'
  | 'PROVIDER_VERIFIED'
  | 'PROVIDER_SUSPENDED'
  | 'SYSTEM';

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || undefined,
    },
  });
}

// Helper functions for common notification types

export async function notifyNewBooking(providerId: string, providerUserId: string, clientName: string, serviceName: string, bookingId: string) {
  return createNotification({
    userId: providerUserId,
    type: 'BOOKING_NEW',
    title: 'Nouvelle réservation',
    message: `${clientName} a réservé "${serviceName}"`,
    data: { bookingId, providerId },
  });
}

export async function notifyBookingStatus(clientUserId: string, providerName: string, status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED', bookingId: string) {
  const statusMap = {
    ACCEPTED: { type: 'BOOKING_ACCEPTED' as NotificationType, title: 'Réservation acceptée', msg: `${providerName} a accepté votre réservation` },
    REJECTED: { type: 'BOOKING_REJECTED' as NotificationType, title: 'Réservation refusée', msg: `${providerName} a refusé votre réservation` },
    COMPLETED: { type: 'BOOKING_COMPLETED' as NotificationType, title: 'Service terminé', msg: `${providerName} a marqué le service comme terminé` },
  };
  const info = statusMap[status];
  return createNotification({
    userId: clientUserId,
    type: info.type,
    title: info.title,
    message: info.msg,
    data: { bookingId },
  });
}

export async function notifyFormationPurchase(providerUserId: string, clientName: string, formationTitle: string, formationId: string) {
  return createNotification({
    userId: providerUserId,
    type: 'FORMATION_PURCHASE',
    title: 'Nouvelle vente de formation',
    message: `${clientName} a acheté "${formationTitle}"`,
    data: { formationId },
  });
}

export async function notifyNewReview(providerUserId: string, clientName: string, rating: number, providerId: string) {
  return createNotification({
    userId: providerUserId,
    type: 'REVIEW_NEW',
    title: 'Nouvel avis',
    message: `${clientName} vous a donné ${rating} étoile${rating > 1 ? 's' : ''}`,
    data: { providerId },
  });
}

export async function notifyProviderVerified(providerUserId: string) {
  return createNotification({
    userId: providerUserId,
    type: 'PROVIDER_VERIFIED',
    title: 'Profil vérifié !',
    message: 'Félicitations ! Votre profil est maintenant visible sur la plateforme.',
  });
}

export async function notifyProviderSuspended(providerUserId: string, suspended: boolean) {
  return createNotification({
    userId: providerUserId,
    type: suspended ? 'PROVIDER_SUSPENDED' : 'PROVIDER_VERIFIED',
    title: suspended ? 'Profil suspendu' : 'Profil réactivé',
    message: suspended
      ? 'Votre profil a été suspendu par l\'administration.'
      : 'Votre profil a été réactivé par l\'administration.',
  });
}
