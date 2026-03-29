"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, BookOpen, Users, Lock, Play, Image as ImageIcon, FileText, CheckCircle, ShoppingCart } from "lucide-react";

import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Skeleton } from "@/components/ui/skeleton";

function MediaPlayer({ media }: { media: any }) {
  if (media.type === "VIDEO") {
    return (
      <div className="rounded-lg overflow-hidden bg-black">
        <video controls className="w-full max-h-[500px]" preload="metadata">
          <source src={media.url} />
        </video>
      </div>
    );
  }
  if (media.type === "IMAGE") {
    return (
      <div className="rounded-lg overflow-hidden">
        <img src={media.url} alt={media.name || "Image"} className="w-full object-contain max-h-[500px]" />
      </div>
    );
  }
  // DOCUMENT
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
    >
      <FileText className="w-8 h-8 text-musso-pink" />
      <div>
        <p className="font-medium text-sm">{media.name || "Document"}</p>
        <p className="text-xs text-gray-500">Cliquez pour ouvrir</p>
      </div>
    </a>
  );
}

function MediaIcon({ type }: { type: string }) {
  if (type === "VIDEO") return <Play className="w-3.5 h-3.5" />;
  if (type === "IMAGE") return <ImageIcon className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

export default function FormationDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const { data: formation, isLoading } = useQuery({
    queryKey: ["formation", id],
    queryFn: () => apiGet<any>(`/formations/${id}`),
  });

  const purchaseMutation = useMutation({
    mutationFn: () => apiPost(`/formations/${id}/purchase`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formation", id] });
    },
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="aspect-video w-full rounded-card mb-6" />
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </>
    );
  }

  if (!formation) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="font-heading font-bold text-xl mb-2">Formation introuvable</h2>
          <Link href="/formations" className="text-musso-pink hover:underline">Retour aux formations</Link>
        </div>
      </>
    );
  }

  const f = formation;

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Retour */}
        <Link href="/formations" className="text-sm text-gray-500 hover:text-musso-pink flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour aux formations
        </Link>

        {/* Couverture */}
        <div className="aspect-video bg-gradient-to-br from-musso-pink-light to-pink-100 rounded-card overflow-hidden mb-6 flex items-center justify-center">
          {f.coverUrl ? (
            <img src={f.coverUrl} alt={f.title} className="w-full h-full object-cover" />
          ) : (
            <GraduationCap className="w-20 h-20 text-musso-pink/30" />
          )}
        </div>

        {/* Info */}
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-2">{f.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
            <span>par <strong className="text-gray-700">{f.providerName}</strong></span>
            {f.quartierName && <span>{f.quartierName}</span>}
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {f.modules.length} module{f.modules.length > 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {f.totalStudents} inscrit{f.totalStudents > 1 ? "s" : ""}</span>
          </div>
          {f.description && (
            <p className="text-gray-600">{f.description}</p>
          )}
        </div>

        {/* Prix + Bouton achat */}
        {!f.isOwner && !f.hasAccess && (
          <div className="bg-gradient-to-r from-musso-pink to-pink-600 rounded-card p-6 mb-6 text-white text-center">
            <p className="text-3xl font-bold mb-2">
              {f.price === 0 ? "Gratuit" : `${f.price.toLocaleString()} FCFA`}
            </p>
            {!user ? (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-white text-musso-pink font-semibold px-8 py-3 rounded-btn hover:bg-gray-50 transition-all"
              >
                Connectez-vous pour acheter
              </Link>
            ) : (
              <button
                onClick={() => purchaseMutation.mutate()}
                disabled={purchaseMutation.isPending}
                className="inline-flex items-center gap-2 bg-white text-musso-pink font-semibold px-8 py-3 rounded-btn hover:bg-gray-50 transition-all disabled:opacity-70"
              >
                <ShoppingCart className="w-5 h-5" />
                {purchaseMutation.isPending ? "Achat en cours..." : f.price === 0 ? "S'inscrire gratuitement" : "Acheter cette formation"}
              </button>
            )}
            {purchaseMutation.isError && (
              <p className="text-sm mt-2 text-pink-200">{(purchaseMutation.error as any)?.message || "Erreur lors de l'achat"}</p>
            )}
          </div>
        )}

        {f.hasAccess && (
          <div className="bg-green-50 border border-green-200 rounded-card p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">
                {f.isOwner ? "Vous êtes le créateur de cette formation" : "Vous avez accès à cette formation"}
              </p>
              <p className="text-sm text-green-600">Tous les contenus sont disponibles ci-dessous</p>
            </div>
          </div>
        )}

        {/* Modules */}
        <div className="mb-6">
          <h2 className="font-heading font-bold text-xl mb-4">Contenu de la formation</h2>
          {f.modules.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2" />
              <p>Aucun module pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {f.modules.map((module: any, idx: number) => {
                const isOpen = activeModule === module.id;
                return (
                  <div key={module.id} className="border border-gray-200 rounded-card overflow-hidden">
                    <button
                      onClick={() => setActiveModule(isOpen ? null : module.id)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-musso-pink-light flex items-center justify-center flex-shrink-0">
                        <span className="text-musso-pink font-bold text-sm">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{module.title}</h3>
                        {module.description && (
                          <p className="text-xs text-gray-500 truncate">{module.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                        {f.hasAccess ? (
                          <span>{module.medias?.length || module.totalMedias} fichier{(module.medias?.length || module.totalMedias) > 1 ? "s" : ""}</span>
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Contenu du module (si ouvert et a accès) */}
                    {isOpen && f.hasAccess && module.medias && module.medias.length > 0 && (
                      <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                        {module.medias.map((media: any) => (
                          <div key={media.id}>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <MediaIcon type={media.type} />
                              <span>{media.name || media.type}</span>
                            </div>
                            <MediaPlayer media={media} />
                          </div>
                        ))}
                      </div>
                    )}

                    {isOpen && !f.hasAccess && (
                      <div className="border-t border-gray-100 p-6 text-center bg-gray-50">
                        <Lock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Achetez cette formation pour accéder au contenu</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
