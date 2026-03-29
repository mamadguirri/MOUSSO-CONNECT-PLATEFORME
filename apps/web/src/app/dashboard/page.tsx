"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { apiGet, apiPostForm, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/status-badge";
import { PhotoUpload } from "@/components/photo-upload";
import {
  ExternalLink, Calendar, Clock, CheckCircle, AlertCircle, Edit,
  GraduationCap, Plus, Star, Users, BookOpen,
  TrendingUp, Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: provider, isLoading } = useQuery({
    queryKey: ["my-provider"],
    queryFn: () => apiGet<any>(`/users/me`).then(async (u: any) => {
      if (!u.providerId) return null;
      return apiGet<any>(`/providers/${u.providerId}`);
    }),
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings", "received"],
    queryFn: () => apiGet<any[]>("/bookings/received"),
    enabled: !!user && user.role === "PROVIDER",
  });

  const { data: myFormations = [] } = useQuery({
    queryKey: ["my-formations"],
    queryFn: () => apiGet<any[]>("/formations/my"),
    enabled: !!user && user.role === "PROVIDER",
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ serviceId, files }: { serviceId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("photos", f));
      return apiPostForm(`/providers/me/services/${serviceId}/photos`, formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-provider"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ serviceId, photoId }: { serviceId: string; photoId: string }) =>
      apiDelete(`/providers/me/services/${serviceId}/photos/${photoId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-provider"] }),
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [authLoading, user, router]);

  if (authLoading || isLoading) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">Chargement...</div>
      </>
    );
  }

  if (!user) return null;

  if (!provider) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-musso-pink-light flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-musso-pink" />
          </div>
          <h1 className="font-heading font-bold text-xl mb-2">Bienvenue sur Musso Connect !</h1>
          <p className="text-gray-500 mb-6">Créez votre profil prestataire pour commencer à recevoir des réservations.</p>
          <Link
            href="/become-provider"
            className="inline-flex items-center justify-center gap-2 bg-musso-pink text-white font-semibold px-6 h-14 rounded-btn hover:brightness-110 text-lg"
          >
            <Plus className="w-5 h-5" />
            Créer mon profil prestataire
          </Link>
        </div>
      </>
    );
  }

  const pendingBookings = bookings.filter((b: any) => b.status === "PENDING");
  const acceptedBookings = bookings.filter((b: any) => b.status === "ACCEPTED");
  const completedBookings = bookings.filter((b: any) => b.status === "COMPLETED");
  const totalPhotos = provider.services?.reduce((acc: number, s: any) => acc + (s.photos?.length || 0), 0) || 0;

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header avec profil */}
        <div className="bg-gradient-to-r from-musso-pink to-pink-600 rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/40">
              {provider.avatarUrl ? (
                <img src={provider.avatarUrl} alt={provider.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">{provider.name[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading font-bold text-lg">{provider.name}</h1>
                <StatusBadge isVerified={provider.isVerified} isSuspended={false} />
              </div>
              <p className="text-white/80 text-sm">{provider.quartierName}</p>
              {provider.averageRating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                  <span className="text-sm font-medium">{provider.averageRating.toFixed(1)}</span>
                  <span className="text-white/60 text-xs">({provider.totalReviews} avis)</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Link
              href={`/providers/${provider.id}`}
              className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-btn text-sm font-medium transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Voir profil
            </Link>
            <Link
              href="/become-provider"
              className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-btn text-sm font-medium transition-all"
            >
              <Edit className="w-4 h-4" /> Modifier
            </Link>
          </div>
        </div>

        {/* Alerte non vérifié */}
        {!provider.isVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Profil en attente de vérification</p>
              <p className="text-sm text-amber-600 mt-0.5">Votre profil sera visible après validation par l&apos;équipe Musso Connect.</p>
            </div>
          </div>
        )}

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/bookings" className="bg-amber-50 border border-amber-100 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-2xl font-bold text-amber-700">{pendingBookings.length}</span>
            </div>
            <p className="text-sm text-amber-600 font-medium">En attente</p>
          </Link>
          <Link href="/bookings" className="bg-green-50 border border-green-100 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-700">{acceptedBookings.length}</span>
            </div>
            <p className="text-sm text-green-600 font-medium">Acceptées</p>
          </Link>
          <Link href="/bookings" className="bg-blue-50 border border-blue-100 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700">{completedBookings.length}</span>
            </div>
            <p className="text-sm text-blue-600 font-medium">Terminées</p>
          </Link>
          <Link href="/formations/create" className="bg-purple-50 border border-purple-100 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-700">{myFormations.length}</span>
            </div>
            <p className="text-sm text-purple-600 font-medium">Formations</p>
          </Link>
        </div>

        {/* Réservations en attente */}
        {pendingBookings.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Réservations en attente
              </h2>
              <Link href="/bookings" className="text-xs text-musso-pink hover:underline font-medium">Voir tout →</Link>
            </div>
            <div className="space-y-2">
              {pendingBookings.slice(0, 3).map((b: any) => (
                <Link key={b.id} href="/bookings" className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{b.clientName}</p>
                      <p className="text-xs text-musso-pink font-medium">{b.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(b.requestedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-gray-500">{b.requestedTime}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* === MES FORMATIONS === */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              Mes formations
            </h2>
            <Link
              href="/formations/create"
              className="flex items-center gap-1 text-sm bg-musso-pink text-white px-3 py-1.5 rounded-btn font-medium hover:brightness-110"
            >
              <Plus className="w-3.5 h-3.5" /> Créer
            </Link>
          </div>

          {myFormations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">Vous n&apos;avez pas encore de formation</p>
              <Link
                href="/formations/create"
                className="inline-flex items-center gap-2 text-sm text-musso-pink font-medium hover:underline"
              >
                <Plus className="w-4 h-4" /> Créer votre première formation
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myFormations.map((f: any) => (
                <Link key={f.id} href={`/formations/${f.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex">
                    <div className="w-24 h-20 bg-gradient-to-br from-purple-100 to-pink-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {f.coverUrl ? (
                        <img src={f.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <GraduationCap className="w-8 h-8 text-purple-300" />
                      )}
                    </div>
                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate">{f.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                          f.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {f.isPublished ? "Publié" : "Brouillon"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {f.totalModules} module{f.totalModules > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {f.totalStudents} inscrit{f.totalStudents > 1 ? "s" : ""}
                        </span>
                        <span className="font-semibold text-musso-pink">
                          {f.price === 0 ? "Gratuit" : `${f.price.toLocaleString()} F`}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Services avec galeries */}
        {provider.services && provider.services.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-600" />
                Mes services ({provider.services.length})
              </h2>
              <span className="text-xs text-gray-400">{totalPhotos} photos</span>
            </div>
            {provider.services.map((service: any) => (
              <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-musso-pink-light text-musso-pink">{service.categoryName}</Badge>
                    {service.priceRange && (
                      <span className="text-sm text-gray-500">{service.priceRange}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{service.photos?.length || 0}/10 photos</span>
                </div>
                {service.description && (
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                )}
                <PhotoUpload
                  maxFiles={10}
                  existingPhotos={service.photos || []}
                  uploading={uploadMutation.isPending}
                  onFilesChange={(files) => {
                    if (files.length > 0) uploadMutation.mutate({ serviceId: service.id, files });
                  }}
                  onRemoveExisting={(photoId) => deleteMutation.mutate({ serviceId: service.id, photoId })}
                />
                {uploadMutation.isPending && (
                  <p className="text-sm text-gray-500 mt-2">Upload en cours...</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 mb-3">Aucun service configuré</p>
            <Link href="/become-provider" className="text-musso-pink hover:underline text-sm font-medium">
              Ajouter des services
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
