"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { apiGet } from "@/lib/api";
import { SearchBar } from "@/components/search-bar";
import { CategoryGrid } from "@/components/category-grid";
import { ProviderGrid } from "@/components/provider-grid";

export default function HomePage() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<any[]>("/categories"),
  });

  const { data: quartiers = [] } = useQuery({
    queryKey: ["quartiers"],
    queryFn: () => apiGet<any[]>("/quartiers"),
  });

  const { data: providersData, isLoading } = useQuery({
    queryKey: ["providers-recent"],
    queryFn: () => apiGet<any>("/providers?limit=6"),
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-musso-pink to-pink-600 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-heading font-bold text-3xl md:text-5xl mb-4">
            Chaque femme mérite le succès
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Trouvez les meilleures prestataires de services artisanaux à Bamako
          </p>
          <div className="max-w-2xl mx-auto bg-white rounded-card p-4 shadow-lg">
            <SearchBar categories={categories} quartiers={quartiers} />
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-heading font-bold text-2xl mb-6">Catégories</h2>
        <CategoryGrid categories={categories} />
      </section>

      {/* Prestataires récentes */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-2xl">Prestataires récentes</h2>
          <Link
            href="/search"
            className="text-musso-pink text-sm font-medium hover:underline"
          >
            Voir tout
          </Link>
        </div>
        <ProviderGrid
          providers={providersData?.providers || []}
          loading={isLoading}
        />
      </section>

      {/* CTA */}
      <section className="bg-musso-pink-light py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-heading font-bold text-2xl mb-3">
            Vous êtes prestataire ?
          </h2>
          <p className="text-gray-600 mb-6">
            Créez votre profil gratuitement et rejoignez la communauté Musso Connect
          </p>
          <Link
            href="/become-provider"
            className="inline-flex items-center justify-center bg-musso-pink text-white font-semibold px-8 h-12 rounded-btn hover:brightness-110 transition-all"
          >
            Créer mon profil prestataire
          </Link>
        </div>
      </section>
    </div>
  );
}
