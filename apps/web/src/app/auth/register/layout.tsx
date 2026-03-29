import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte gratuit",
  description:
    "Créez votre compte Musso Connect gratuitement. Inscrivez-vous pour réserver des services artisanaux ou proposer vos services à Bamako, Mali.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
