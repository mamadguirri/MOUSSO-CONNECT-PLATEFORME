import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes réservations",
  description:
    "Consultez et gérez vos réservations de services artisanaux sur Musso Connect. Suivez le statut de vos demandes, acceptez ou refusez des réservations et gardez un historique complet de vos prestations à Bamako.",
};

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
