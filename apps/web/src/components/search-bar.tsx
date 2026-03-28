"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  categories: { id: string; name: string; slug: string }[];
  quartiers: { id: string; name: string }[];
  defaultCategory?: string;
  defaultQuartier?: string;
}

export function SearchBar({ categories, quartiers, defaultCategory, defaultQuartier }: SearchBarProps) {
  const router = useRouter();
  const [category, setCategory] = useState(defaultCategory || "");
  const [quartier, setQuartier] = useState(defaultQuartier || "");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (quartier) params.set("quartier", quartier);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="flex-1 h-12 rounded-btn border border-gray-200 px-4 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-musso-pink"
      >
        <option value="" className="text-gray-500">Toutes les catégories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug} className="text-gray-700">
            {cat.name}
          </option>
        ))}
      </select>
      <select
        value={quartier}
        onChange={(e) => setQuartier(e.target.value)}
        className="flex-1 h-12 rounded-btn border border-gray-200 px-4 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-musso-pink"
      >
        <option value="" className="text-gray-500">Tous les quartiers</option>
        {quartiers.map((q) => (
          <option key={q.id} value={q.id}>
            {q.name}
          </option>
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
  );
}
