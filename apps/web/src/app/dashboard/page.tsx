"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { apiGet, apiPostForm, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/status-badge";
import { PhotoUpload } from "@/components/photo-upload";
import { ExternalLink, Calendar, Clock, CheckCircle, AlertCircle, Edit } from "lucide-react";
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

  if (authLoading || isLoading) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">Chargement...</div>
      </>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  if (!provider) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h1 className="font-heading font-bold text-xl mb-2">Bienvenue sur Musso Connect !</h1>
          <p className="text-gray-500 mb-6">Créez votre profil prestataire pour commencer à recevoir des réservations.</p>
          <Link
            href="/become-provider"
            className="inline-flex items-center justify-center bg-musso-pink text-white font-semibold px-6 h-12 rounded-btn hover:brightness-110"
          >
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-2xl">Tableau de bord</h1>
          <StatusBadge isVerified={provider.isVerified} isSuspended={false} />
        </div>

        {/* Alerte non vérifié */}
        {!provider.isVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-card p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Profil en attente de vérification</p>
              <p className="text-xs text-amber-600">Votre profil sera visible après validation par l&apos;équipe Musso Connect.</p>
            </div>
          </div>
        )}

        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <Link href="/bookings" className="bg-amber-50 rounded-lg p-3 text-center hover:shadow-sm transition-shadow">
            <p className="text-xl font-bold text-amber-700">{pendingBookings.length}</p>
            <p className="text-xs text-amber-600">En attente</p>
          </Link>
          <Link href="/bookings" className="bg-green-50 rounded-lg p-3 text-center hover:shadow-sm transition-shadow">
            <p className="text-xl font-bold text-green-700">{acceptedBookings.length}</p>
            <p className="text-xs text-green-600">Acceptées</p>
          </Link>
          <Link href="/bookings" className="bg-blue-50 rounded-lg p-3 text-center hover:shadow-sm transition-shadow">
            <p className="text-xl font-bold text-blue-700">{completedBookings.length}</p>
            <p className="text-xs text-blue-600">Terminées</p>
          </Link>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-purple-700">{provider.services?.length || 0}</p>
            <p className="text-xs text-purple-600">Services</p>
          </div>
        </div>

        {/* Réservations en attente */}
        {pendingBookings.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Réservations en attente
              </h2>
              <Link href="/bookings" className="text-xs text-musso-pink hover:underline">Voir tout</Link>
            </div>
            <div className="space-y-2">
              {pendingBookings.slice(0, 3).map((b: any) => (
                <Link key={b.id} href="/bookings" className="block bg-white rounded-card shadow-sm p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{b.clientName}</p>
                      <p className="text-xs text-musso-pink">{b.serviceName}</p>
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

        {/* Profil résumé */}
        <div className="bg-white rounded-card shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-musso-pink-light flex items-center justify-center overflow-hidden">
              {provider.avatarUrl ? (
                <img src={provider.avatarUrl} alt={provider.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-musso-pink text-2xl font-bold">{provider.name[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{provider.name}</h2>
              <p className="text-sm text-gray-500">{provider.quartierName}, Bamako</p>
              {provider.bio && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{provider.bio}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Link
              href={`/providers/${provider.id}`}
              className="flex-1 h-10 flex items-center justify-center gap-1 border border-gray-200 rounded-btn text-sm hover:bg-gray-50"
            >
              <ExternalLink className="w-4 h-4" /> Voir mon profil
            </Link>
            <Link
              href="/become-provider"
              className="flex-1 h-10 flex items-center justify-center gap-1 border border-gray-200 rounded-btn text-sm hover:bg-gray-50"
            >
              <Edit className="w-4 h-4" /> Modifier
            </Link>
            <Link
              href="/bookings"
              className="flex-1 h-10 flex items-center justify-center gap-1 bg-musso-pink text-white rounded-btn text-sm hover:brightness-110"
            >
              <Calendar className="w-4 h-4" /> Réservations
            </Link>
          </div>
        </div>

        {/* Services avec galeries séparées */}
        {provider.services && provider.services.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-lg">Mes services ({provider.services.length})</h2>
              <span className="text-xs text-gray-400">{totalPhotos} photos au total</span>
            </div>
            {provider.services.map((service: any) => (
              <div key={service.id} className="bg-white rounded-card shadow-sm p-4">
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
                <div>
                  <PhotoUpload
                    maxFiles={10}
                    existingPhotos={service.photos || []}
                    onFilesChange={(files) => {
                      if (files.length > 0) uploadMutation.mutate({ serviceId: service.id, files });
                    }}
                    onRemoveExisting={(photoId) => deleteMutation.mutate({ serviceId: service.id, photoId })}
                  />
                </div>
                {uploadMutation.isPending && (
                  <p className="text-sm text-gray-500 mt-2">Upload en cours...</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-card shadow-sm p-6 text-center">
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
