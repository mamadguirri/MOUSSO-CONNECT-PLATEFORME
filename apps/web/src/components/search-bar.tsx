"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Navigation, Loader2 } from "lucide-react";

import { useGeolocation } from "@/hooks/use-geolocation";

interface Quartier {
  id: string;
  name: string;
  ville: string;
  region: string;
}

interface SearchBarProps {
  categories: { id: string; name: string; slug: string }[];
  quartiers: Quartier[];
  defaultCategory?: string;
  defaultQuartier?: string;
  defaultQuery?: string;
  showNearMe?: boolean;
}

// Grouper les quartiers par région
function groupByRegion(quartiers: Quartier[]) {
  const groups: Record<string, Quartier[]> = {};
  for (const q of quartiers) {
    const key = q.region || "Autre";
    if (!groups[key]) groups[key] = [];
    groups[key].push(q);
  }
  return groups;
}

export function SearchBar({ categories, quartiers, defaultCategory, defaultQuartier, defaultQuery, showNearMe = true }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery || "");
  const [category, setCategory] = useState(defaultCategory || "");
  const [quartier, setQuartier] = useState(defaultQuartier || "");
  const { coords, loading: geoLoading, supported, requestLocation } = useGeolocation();

  const grouped = groupByRegion(quartiers);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (quartier) params.set("quartier", quartier);
    router.push(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleNearMe = () => {
    if (coords) {
      router.push(`/search?nearMe=true`);
    } else {
      requestLocation();
      setTimeout(() => {
        router.push(`/search?nearMe=true`);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Champ de recherche texte */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nom, quartier, service..."
        aria-label="Rechercher un service, un nom ou un quartier"
        className="w-full h-12 rounded-btn border border-gray-200 px-4 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-musso-pink placeholder:text-gray-400"
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Toutes les catégories"
          className="flex-1 h-12 rounded-btn border border-gray-200 px-4 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-musso-pink"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
          aria-label="Toutes les localités"
          className="flex-1 h-12 rounded-btn border border-gray-200 px-4 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-musso-pink"
        >
          <option value="">Toutes les localités</option>
          {Object.entries(grouped).map(([region, items]) => (
            <optgroup key={region} label={`── ${region} ──`}>
              {items.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.region === "Bamako" ? q.name : `${q.name} (${q.ville})`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="h-12 px-6 bg-musso-pink text-white rounded-btn font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Rechercher
        </button>
      </div>
      {showNearMe && supported && (
        <button
          onClick={handleNearMe}
          disabled={geoLoading}
          className="self-center inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-white border-2 border-musso-pink text-musso-pink hover:bg-musso-pink hover:text-white transition-all"
        >
          {geoLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {geoLoading ? "Localisation..." : "Près de moi"}
        </button>
      )}
    </div>
  );
}
