import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tableau de bord",
  description:
    "Gérez votre activité de prestataire sur Musso Connect. Consultez vos réservations en attente, vos statistiques, gérez vos services et galeries photos, et créez des formations pour partager votre savoir-faire.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
