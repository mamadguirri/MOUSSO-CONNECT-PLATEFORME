import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir prestataire",
  description:
    "Rejoignez Musso Connect en tant que prestataire artisanale à Bamako. Créez votre profil gratuitement et recevez des réservations en ligne.",
};

export default function BecomeProviderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
