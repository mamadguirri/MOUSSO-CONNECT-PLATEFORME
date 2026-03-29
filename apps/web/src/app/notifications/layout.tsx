import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Restez informée de toutes les activités de votre compte Musso Connect. Nouvelles réservations, confirmations, avis clients, achats de formations et mises à jour importantes de votre profil prestataire.",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
