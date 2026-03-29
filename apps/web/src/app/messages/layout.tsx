import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
  description:
    "Échangez directement avec les prestataires et clientes sur Musso Connect. Envoyez des messages, partagez des photos et des fichiers pour coordonner vos réservations de services artisanaux à Bamako.",
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
