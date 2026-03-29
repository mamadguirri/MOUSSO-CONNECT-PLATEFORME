import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    absolute: "Musso Connect - Prestataires artisanales à Bamako",
  },
  description:
    "Découvrez et réservez les meilleures prestataires de services artisanaux à Bamako, Mali. Coiffure, maquillage, couture, henné, manucure et plus.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <footer className="bg-musso-dark text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-heading font-bold text-lg mb-1">Musso Connect</p>
          <p className="text-sm text-gray-400">Chaque femme mérite le succès</p>
          <p className="text-xs text-gray-500 mt-4">&copy; 2024 Musso Connect. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  );
}
