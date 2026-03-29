import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formations professionnelles",
  description:
    "Formations professionnelles par les meilleures prestataires artisanales de Bamako. Coiffure, maquillage, couture, henné et plus sur Musso Connect.",
};

export default function FormationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
