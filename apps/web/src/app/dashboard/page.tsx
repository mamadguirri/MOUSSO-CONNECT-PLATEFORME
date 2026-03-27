"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { apiGet, apiPostForm, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/status-badge";
import { PhotoUpload } from "@/components/photo-upload";
import { ExternalLink, Calendar } from "lucide-react";
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
          <h1 className="font-heading font-bold text-xl mb-4">Vous n&apos;avez pas encore de profil prestataire</h1>
          <Link
            href="/become-provider"
            className="inline-flex items-center justify-center bg-musso-pink text-white font-semibold px-6 h-12 rounded-btn hover:brightness-110"
          >
            Créer mon profil
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-2xl">Tableau de bord</h1>
          <StatusBadge isVerified={provider.isVerified} isSuspended={false} />
        </div>

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
            <div>
              <h2 className="font-semibold text-lg">{provider.name}</h2>
              <p className="text-sm text-gray-500">{provider.quartierName}</p>
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
              href="/bookings"
              className="flex-1 h-10 flex items-center justify-center gap-1 bg-musso-pink text-white rounded-btn text-sm hover:brightness-110"
            >
              <Calendar className="w-4 h-4" /> Mes réservations
            </Link>
          </div>
        </div>

        {/* Services avec galeries séparées */}
        {provider.services && provider.services.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-lg">Mes services</h2>
            {provider.services.map((service: any) => (
              <div key={service.id} className="bg-white rounded-card shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-musso-pink-light text-musso-pink">{service.categoryName}</Badge>
                  {service.priceRange && (
                    <span className="text-sm text-gray-500">{service.priceRange}</span>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                )}
                <div>
                  <p className="text-sm font-medium mb-2">Photos de ce service ({service.photos?.length || 0}/10)</p>
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
          <div className="bg-white rounded-card shadow-sm p-4 text-center">
            <p className="text-gray-500 mb-3">Aucun service configuré</p>
            <Link href="/become-provider" className="text-musso-pink hover:underline text-sm">
              Modifier mon profil
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
