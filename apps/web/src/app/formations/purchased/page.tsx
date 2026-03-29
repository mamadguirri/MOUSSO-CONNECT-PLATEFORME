"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GraduationCap, BookOpen, ArrowLeft } from "lucide-react";

import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function PurchasedFormationsPage() {
  const { user } = useAuth();

  const { data: formations = [], isLoading } = useQuery({
    queryKey: ["purchased-formations"],
    queryFn: () => apiGet<any[]>("/formations/purchased"),
    enabled: !!user,
  });

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/formations" className="text-sm text-gray-500 hover:text-musso-pink flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Toutes les formations
        </Link>

        <h1 className="font-heading font-bold text-2xl mb-6 flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-musso-pink" />
          Mes formations
        </h1>

        {!user ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Connectez-vous pour voir vos formations</p>
            <Link href="/auth/login" className="text-musso-pink hover:underline font-semibold">Se connecter</Link>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-card" />
            ))}
          </div>
        ) : formations.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-2">Aucune formation achetée</h3>
            <p className="text-gray-500 text-sm mb-4">Découvrez les formations disponibles</p>
            <Link href="/formations" className="text-musso-pink hover:underline font-semibold">
              Voir les formations →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {formations.map((f: any) => (
              <Link key={f.id} href={`/formations/${f.id}`}>
                <div className="bg-white rounded-card shadow-sm hover:shadow-md transition-all p-4 flex gap-4 border border-transparent hover:border-musso-pink/20">
                  <div className="w-24 h-16 rounded-lg bg-musso-pink-light flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {f.coverUrl ? (
                      <img src={f.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <GraduationCap className="w-8 h-8 text-musso-pink/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{f.title}</h3>
                    <p className="text-xs text-gray-500">par {f.providerName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {f.totalModules} module{f.totalModules > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="text-musso-pink font-semibold text-sm self-center">
                    Continuer →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
