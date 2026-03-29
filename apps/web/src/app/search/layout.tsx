import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rechercher une prestataire",
  description:
    "Trouvez des prestataires de services artisanaux à Bamako par catégorie ou quartier. Coiffure, maquillage, couture, henné et plus sur Musso Connect.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
