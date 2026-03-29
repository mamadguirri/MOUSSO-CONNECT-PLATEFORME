"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { X, SlidersHorizontal, Users, Navigation, Loader2 } from "lucide-react";

import { apiGet } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { SearchBar } from "@/components/search-bar";
import { ProviderGrid } from "@/components/provider-grid";
import { Pagination } from "@/components/pagination";
import { useGeolocation } from "@/hooks/use-geolocation";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryText = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const quartierId = searchParams.get("quartier") || "";
  const [page, setPage] = useState(1);
  const [nearMe, setNearMe] = useState(false);
  const { coords, loading: geoLoading, error: geoError, supported: geoSupported, requestLocation } = useGeolocation();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<any[]>("/categories"),
  });

  const { data: quartiers = [] } = useQuery({
    queryKey: ["quartiers"],
    queryFn: () => apiGet<any[]>("/quartiers"),
  });

  // Construire l'URL de l'API selon le mode
  const buildApiUrl = () => {
    if (nearMe && coords) {
      const params = new URLSearchParams();
      params.set("lat", coords.latitude.toString());
      params.set("lng", coords.longitude.toString());
      params.set("radius", "15");
      if (categorySlug) params.set("categorySlug", categorySlug);
      params.set("page", page.toString());
      params.set("limit", "20");
      return `/providers/nearby?${params.toString()}`;
    }

    const params = new URLSearchParams();
    if (queryText) params.set("q", queryText);
    if (categorySlug) params.set("categorySlug", categorySlug);
    if (quartierId) params.set("quartierId", quartierId);
    if (coords) {
      params.set("lat", coords.latitude.toString());
      params.set("lng", coords.longitude.toString());
    }
    params.set("page", page.toString());
    params.set("limit", "20");
    return `/providers?${params.toString()}`;
  };

  const { data, isLoading } = useQuery({
    queryKey: ["providers", nearMe, coords?.latitude, coords?.longitude, queryText, categorySlug, quartierId, page],
    queryFn: () => apiGet<any>(buildApiUrl()),
  });

  const hasFilters = queryText || categorySlug || quartierId || nearMe;
  const activeCategoryName = categorySlug ? categories.find((c: any) => c.slug === categorySlug)?.name : null;
  const activeQuartierName = quartierId ? quartiers.find((q: any) => q.id === quartierId)?.name : null;

  const clearFilters = () => {
    setNearMe(false);
    router.push("/search");
  };

  const removeFilter = (type: "category" | "quartier" | "nearMe") => {
    if (type === "nearMe") {
      setNearMe(false);
      return;
    }
    const p = new URLSearchParams();
    if (type !== "category" && categorySlug) p.set("category", categorySlug);
    if (type !== "quartier" && quartierId) p.set("quartier", quartierId);
    router.push(`/search?${p.toString()}`);
  };

  const handleNearMe = () => {
    if (nearMe) {
      setNearMe(false);
      return;
    }
    if (coords) {
      setNearMe(true);
    } else {
      requestLocation();
      setNearMe(true);
    }
  };

  // Quand les coordonnées arrivent et que nearMe est activé, on re-render automatiquement
  useEffect(() => {
    if (nearMe && !coords && !geoLoading) {
      requestLocation();
    }
  }, [nearMe, coords, geoLoading, requestLocation]);

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading font-bold text-2xl">Rechercher une prestataire</h1>
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-musso-pink hover:underline flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Effacer les filtres
            </button>
          )}
        </div>

        <div className="mb-4">
          <SearchBar
            categories={categories}
            quartiers={quartiers}
            defaultQuery={queryText}
            defaultCategory={categorySlug}
            defaultQuartier={quartierId}
            showNearMe={false}
          />
        </div>

        {/* Bouton "Près de moi" */}
        {geoSupported && (
          <div className="mb-4">
            <button
              onClick={handleNearMe}
              disabled={geoLoading}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                nearMe
                  ? "bg-musso-pink text-white shadow-md"
                  : "bg-white border-2 border-musso-pink text-musso-pink hover:bg-musso-pink-light"
              } ${geoLoading ? "opacity-70" : ""}`}
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {geoLoading ? "Localisation..." : nearMe ? "Près de moi ✓" : "Près de moi"}
            </button>
            {geoError && (
              <p className="text-xs text-red-500 mt-1.5 ml-1">{geoError}</p>
            )}
          </div>
        )}

        {/* Filtres actifs */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            {queryText && (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                &quot;{queryText}&quot;
                <button onClick={() => { const p = new URLSearchParams(); if (categorySlug) p.set("category", categorySlug); if (quartierId) p.set("quartier", quartierId); router.push(`/search?${p.toString()}`); }} className="hover:text-gray-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {nearMe && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                <Navigation className="w-3 h-3" /> Près de moi
                <button onClick={() => removeFilter("nearMe")} className="hover:text-green-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeCategoryName && (
              <span className="inline-flex items-center gap-1 bg-musso-pink-light text-musso-pink text-xs font-medium px-2.5 py-1 rounded-full">
                {activeCategoryName}
                <button onClick={() => removeFilter("category")} className="hover:text-musso-pink/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeQuartierName && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">
                {activeQuartierName}
                <button onClick={() => removeFilter("quartier")} className="hover:text-blue-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Nombre de résultats */}
        {data && !isLoading && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>
              <strong className="text-gray-700">{data.total || data.providers?.length || 0}</strong> prestataire{(data.total || data.providers?.length || 0) > 1 ? "s" : ""} trouvée{(data.total || data.providers?.length || 0) > 1 ? "s" : ""}
              {nearMe && " près de vous"}
            </span>
          </div>
        )}

        <ProviderGrid providers={data?.providers || []} loading={isLoading} />
        {data && data.totalPages > 1 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
