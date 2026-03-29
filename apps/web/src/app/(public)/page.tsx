"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { SearchBar } from "@/components/search-bar";
import { CategoryGrid } from "@/components/category-grid";
import { ProviderGrid } from "@/components/provider-grid";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function HomePage() {
  const { user } = useAuth();
  const { coords } = useGeolocation();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<any[]>("/categories"),
  });

  const { data: quartiers = [] } = useQuery({
    queryKey: ["quartiers"],
    queryFn: () => apiGet<any[]>("/quartiers"),
  });

  // Si on a les coordonnées, charger les prestataires à proximité
  const nearbyUrl = coords
    ? `/providers/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=20&limit=6`
    : `/providers?limit=6`;

  const { data: providersData, isLoading } = useQuery({
    queryKey: ["providers-home", coords?.latitude, coords?.longitude],
    queryFn: () => apiGet<any>(nearbyUrl),
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
            Trouvez les meilleures prestataires de services artisanaux au Mali
          </p>
          <div className="max-w-2xl mx-auto bg-white rounded-card p-4 shadow-lg">
            <SearchBar categories={categories} quartiers={quartiers} />
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-heading font-bold text-2xl mb-8 text-center">Comment ça marche ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-musso-pink-light flex items-center justify-center mx-auto mb-3">
              <span className="text-musso-pink font-bold text-lg">1</span>
            </div>
            <h3 className="font-semibold mb-1">Recherchez</h3>
            <p className="text-sm text-gray-500">Trouvez une prestataire par catégorie ou quartier à Bamako</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-musso-pink-light flex items-center justify-center mx-auto mb-3">
              <span className="text-musso-pink font-bold text-lg">2</span>
            </div>
            <h3 className="font-semibold mb-1">Consultez</h3>
            <p className="text-sm text-gray-500">Regardez les profils, galeries photos et avis des clientes</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-musso-pink-light flex items-center justify-center mx-auto mb-3">
              <span className="text-musso-pink font-bold text-lg">3</span>
            </div>
            <h3 className="font-semibold mb-1">Réservez</h3>
            <p className="text-sm text-gray-500">Envoyez une demande de réservation ou contactez via WhatsApp</p>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-2xl">Catégories</h2>
            <span className="text-sm text-gray-400">{categories.length} catégories</span>
          </div>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      {/* Prestataires à proximité / récentes */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-2xl">
            {coords ? "Prestataires à proximité" : "Prestataires"}
          </h2>
          <Link
            href="/search"
            className="text-musso-pink text-sm font-medium hover:underline flex items-center gap-1"
          >
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <ProviderGrid
          providers={providersData?.providers || []}
          loading={isLoading}
        />
      </section>

      {/* CTA - masqué pour les prestataires */}
      {(!user || user.role !== "PROVIDER") && (
        <section className="bg-gradient-to-r from-musso-pink to-pink-600 py-12">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="font-heading font-bold text-2xl mb-3">
              Vous êtes prestataire ?
            </h2>
            <p className="opacity-90 mb-4">
              Créez votre profil et rejoignez la communauté Musso Connect
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" /> Gratuit 1 mois
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" /> Visibilité au Mali
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" /> Réservations en ligne
              </div>
            </div>
            <Link
              href="/become-provider"
              className="inline-flex items-center justify-center bg-white text-musso-pink font-semibold px-8 h-12 rounded-btn hover:bg-gray-50 transition-all"
            >
              Créer mon profil prestataire
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
