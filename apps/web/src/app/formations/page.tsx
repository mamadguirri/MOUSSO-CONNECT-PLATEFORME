"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Users, GraduationCap } from "lucide-react";

import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Skeleton } from "@/components/ui/skeleton";

function FormationCard({ formation }: { formation: any }) {
  return (
    <Link href={`/formations/${formation.id}`}>
      <div className="bg-white rounded-card shadow-sm hover:shadow-md transition-all border border-transparent hover:border-musso-pink/20 overflow-hidden h-full flex flex-col">
        {/* Couverture */}
        <div className="aspect-video bg-gradient-to-br from-musso-pink-light to-pink-100 flex items-center justify-center">
          {formation.coverUrl ? (
            <img src={formation.coverUrl} alt={formation.title} className="w-full h-full object-cover" />
          ) : (
            <GraduationCap className="w-12 h-12 text-musso-pink/40" />
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-heading font-semibold text-base line-clamp-2 mb-1">{formation.title}</h3>
          {formation.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{formation.description}</p>
          )}
          <div className="mt-auto">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {formation.totalModules} module{formation.totalModules > 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {formation.totalStudents} inscrit{formation.totalStudents > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">par {formation.providerName}</span>
              <span className="font-bold text-musso-pink">
                {formation.price === 0 ? "Gratuit" : `${formation.price.toLocaleString()} FCFA`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-card shadow-sm overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

export default function FormationsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["formations", search, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      params.set("page", page.toString());
      return apiGet<any>(`/formations?${params.toString()}`);
    },
  });

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-musso-pink" />
              Formations
            </h1>
            <p className="text-sm text-gray-500 mt-1">Apprenez auprès des meilleures prestataires</p>
          </div>
          <div className="flex gap-2">
            {user?.role === "PROVIDER" && (
              <Link
                href="/formations/create"
                className="bg-musso-pink text-white px-4 py-2 rounded-btn text-sm font-semibold hover:brightness-110 transition-all"
              >
                + Créer une formation
              </Link>
            )}
            {user && (
              <Link
                href="/formations/purchased"
                className="border-2 border-musso-pink text-musso-pink px-4 py-2 rounded-btn text-sm font-semibold hover:bg-musso-pink-light transition-all"
              >
                Mes formations
              </Link>
            )}
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher une formation..."
            aria-label="Rechercher une formation"
            className="w-full h-12 rounded-btn border border-gray-200 pl-11 pr-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-musso-pink"
          />
        </div>

        {/* Grille de formations */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : data?.formations?.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-2">Aucune formation disponible</h3>
            <p className="text-gray-500 text-sm">
              {search ? "Essayez avec d'autres mots-clés" : "Les formations seront bientôt disponibles"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.formations?.map((f: any) => (
              <FormationCard key={f.id} formation={f} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
