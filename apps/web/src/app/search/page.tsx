"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

import { apiGet } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { SearchBar } from "@/components/search-bar";
import { ProviderGrid } from "@/components/provider-grid";
import { Pagination } from "@/components/pagination";

function SearchContent() {
  const searchParams = useSearchParams();
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

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="font-heading font-bold text-2xl mb-4">Rechercher une prestataire</h1>
        <div className="mb-6">
          <SearchBar
            categories={categories}
            quartiers={quartiers}
            defaultCategory={categorySlug}
            defaultQuartier={quartierId}
          />
        </div>
        <ProviderGrid providers={data?.providers || []} loading={isLoading} />
        {data && (
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
