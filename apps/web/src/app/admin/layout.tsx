import type { Metadata } from "next";
import AdminLayoutClient from "./admin-layout-client";

export const metadata: Metadata = {
  title: "Administration",
  description:
    "Panneau d'administration Musso Connect. Gérez les prestataires, utilisateurs, réservations, formations, avis clients et catégories de services de la plateforme Musso Connect à Bamako, Mali.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
