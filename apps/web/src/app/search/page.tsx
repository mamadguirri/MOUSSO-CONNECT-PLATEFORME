"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { X, SlidersHorizontal, Users } from "lucide-react";

import { apiGet } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { SearchBar } from "@/components/search-bar";
import { ProviderGrid } from "@/components/provider-grid";
import { Pagination } from "@/components/pagination";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categorySlug = searchParams.get("category") || "";
  const quartierId = searchParams.get("quartier") || "";
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<any[]>("/categories"),
  });

  const { data: quartiers = [] } = useQuery({
    queryKey: ["quartiers"],
    queryFn: () => apiGet<any[]>("/quartiers"),
  });

  const params = new URLSearchParams();
  if (categorySlug) params.set("categorySlug", categorySlug);
  if (quartierId) params.set("quartierId", quartierId);
  params.set("page", page.toString());
  params.set("limit", "20");

  const { data, isLoading } = useQuery({
    queryKey: ["providers", categorySlug, quartierId, page],
    queryFn: () => apiGet<any>(`/providers?${params.toString()}`),
  });

  const hasFilters = categorySlug || quartierId;
  const activeCategoryName = categorySlug ? categories.find((c: any) => c.slug === categorySlug)?.name : null;
  const activeQuartierName = quartierId ? quartiers.find((q: any) => q.id === quartierId)?.name : null;

  const clearFilters = () => {
    router.push("/search");
  };

  const removeFilter = (type: "category" | "quartier") => {
    const p = new URLSearchParams();
    if (type !== "category" && categorySlug) p.set("category", categorySlug);
    if (type !== "quartier" && quartierId) p.set("quartier", quartierId);
    router.push(`/search?${p.toString()}`);
  };

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
            defaultCategory={categorySlug}
            defaultQuartier={quartierId}
          />
        </div>

        {/* Filtres actifs */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
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
