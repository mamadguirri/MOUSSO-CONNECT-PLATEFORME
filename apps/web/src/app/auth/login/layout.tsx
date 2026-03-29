import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion à votre compte",
  description:
    "Connectez-vous à Musso Connect pour accéder à vos réservations et gérer votre profil prestataire. Connexion rapide avec votre numéro de téléphone.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
