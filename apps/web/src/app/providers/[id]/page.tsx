"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Clock, CheckCircle, Star, MessageCircle } from "lucide-react";

import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Navbar } from "@/components/navbar";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { PhotoGallery } from "@/components/photo-gallery";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function StarRating({ rating, onRate, interactive = false, size = "md" }: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(i)}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
        >
          <Star
            className={`${sizeClass} ${
              i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgoReview(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`;
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProviderPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { coords } = useGeolocation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeService, setActiveService] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Avis
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider", id],
    queryFn: () => apiGet<any>(`/providers/${id}`),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => apiGet<any>(`/reviews/${id}`),
    enabled: !!id,
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { providerId: string; rating: number; comment?: string }) =>
      apiPost("/reviews", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment("");
    },
  });

  // Vérifier si c'est le propre profil du prestataire
  const isOwnProfile = user?.providerId === id;

  // Calcul de la distance
  let providerDistance: number | null = null;
  if (coords && provider) {
    const pLat = provider.latitude ?? null;
    const pLng = provider.longitude ?? null;
    if (pLat && pLng) {
      const R = 6371;
      const dLat = (pLat - coords.latitude) * Math.PI / 180;
      const dLon = (pLng - coords.longitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords.latitude * Math.PI / 180) * Math.cos(pLat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      providerDistance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    }
  }

  const handleBooking = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!activeService || !bookingDate || !bookingTime || bookingPhone.length !== 8) {
      setBookingError("Veuillez remplir tous les champs");
      return;
    }
    setBookingLoading(true);
    setBookingError("");
    try {
      await apiPost("/bookings", {
        providerId: id,
        serviceId: activeService,
        requestedDate: bookingDate,
        requestedTime: bookingTime,
        note: bookingNote || undefined,
        clientPhone: `+223${bookingPhone}`,
      });
      setBookingSuccess(true);
      setShowBooking(false);
    } catch (e: any) {
      setBookingError(e.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </>
    );
  }

  if (!provider) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h1 className="font-heading font-bold text-xl mb-2">Prestataire introuvable</h1>
          <Link href="/search" className="text-musso-pink hover:underline">
            Retour à la recherche
          </Link>
        </div>
      </>
    );
  }

  const reviews = reviewsData?.reviews || [];
  const avgRating = reviewsData?.averageRating || 0;
  const totalReviews = reviewsData?.totalReviews || 0;

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/search" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-musso-pink mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        {/* Profil */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-musso-pink-light flex items-center justify-center overflow-hidden mx-auto mb-3">
              {provider.avatarUrl ? (
                <img src={provider.avatarUrl} alt={provider.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-musso-pink text-3xl font-bold">{provider.name[0]}</span>
              )}
            </div>
            {provider.isVerified && (
              <div className="absolute bottom-2 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
          <h1 className="font-heading font-bold text-2xl">{provider.name}</h1>

          {/* Note moyenne */}
          {totalReviews > 0 && (
            <div className="flex items-center justify-center gap-2 mt-1">
              <StarRating rating={Math.round(avgRating)} />
              <span className="font-semibold text-gray-700">{avgRating}</span>
              <span className="text-sm text-gray-400">({totalReviews} avis)</span>
            </div>
          )}

          {provider.isVerified && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">
              <CheckCircle className="w-3 h-3" /> Profil vérifié
            </span>
          )}
          {provider.quartierName && (
            <p className="text-gray-500 flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-4 h-4" /> {provider.quartierName}, Bamako
              {providerDistance != null && (
                <span className="text-musso-pink font-semibold ml-1">
                  ({providerDistance < 1 ? `${Math.round(providerDistance * 1000)} m` : `${providerDistance} km`})
                </span>
              )}
            </p>
          )}
          {provider.services && provider.services.length > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {provider.services.length} service{provider.services.length > 1 ? "s" : ""} proposé{provider.services.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Actions */}
        {isOwnProfile ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-blue-700 font-medium text-sm">C&apos;est votre profil</p>
            <button
              onClick={() => router.push("/become-provider")}
              className="mt-2 text-sm text-blue-600 hover:underline font-medium"
            >
              Modifier mon profil →
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-3 gap-2 mb-6">
          <WhatsAppButton
            phone={provider.whatsappNumber}
            providerName={provider.name}
            category={provider.categories?.[0]?.name}
            className="h-12"
          />
          <button
            onClick={async () => {
              if (!user) { router.push("/auth/login"); return; }
              try {
                const data = await apiPost<{ conversationId: string }>("/messages/conversations", { providerId: id });
                router.push(`/messages/${data.conversationId}`);
              } catch (e: any) {
                setBookingError(e.message);
              }
            }}
            className="h-12 border-2 border-musso-pink text-musso-pink font-semibold rounded-btn hover:bg-musso-pink-light flex items-center justify-center gap-1.5 text-sm"
          >
            <MessageCircle className="w-4 h-4" /> Message
          </button>
          <button
            onClick={() => {
              if (!user) { router.push("/auth/login"); return; }
              if (provider.services?.length > 0) {
                setActiveService(provider.services[0].id);
              }
              setShowBooking(true);
            }}
            className="h-12 bg-musso-pink text-white font-semibold rounded-btn hover:brightness-110 flex items-center justify-center gap-1.5 text-sm"
          >
            <Calendar className="w-4 h-4" /> Réserver
          </button>
        </div>
        )}

        {bookingSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded-btn text-sm mb-4 text-center">
            Réservation envoyée ! La prestataire vous contactera.
            <button onClick={() => router.push("/bookings")} className="block mx-auto mt-1 text-green-700 underline text-xs">
              Voir mes réservations
            </button>
          </div>
        )}

        {/* Bio */}
        {provider.bio && (
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-lg mb-2">À propos</h2>
            <p className="text-gray-600">{provider.bio}</p>
          </div>
        )}

        {/* Services avec galeries séparées */}
        {provider.services && provider.services.length > 0 && (
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-lg mb-3">Services proposés</h2>
            <div className="space-y-4">
              {provider.services.map((service: any) => (
                <div key={service.id} className="bg-white rounded-card shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-musso-pink-light text-musso-pink">{service.categoryName}</Badge>
                    {service.priceRange && (
                      <span className="text-sm font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        {service.priceRange} FCFA
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  )}
                  {service.photos && service.photos.length > 0 && (
                    <PhotoGallery photos={service.photos} />
                  )}
                  {!isOwnProfile && (
                    <button
                      onClick={() => {
                        if (!user) { router.push("/auth/login"); return; }
                        setActiveService(service.id);
                        setShowBooking(true);
                      }}
                      className="mt-3 w-full h-9 bg-musso-pink/10 text-musso-pink text-sm font-medium rounded-btn hover:bg-musso-pink/20 flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Réserver ce service
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Avis */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-lg">
              Avis {totalReviews > 0 && <span className="text-gray-400 font-normal text-sm">({totalReviews})</span>}
            </h2>
            {user && !isOwnProfile && (
              <button
                onClick={() => {
                  if (!user) { router.push("/auth/login"); return; }
                  setShowReviewForm(!showReviewForm);
                }}
                className="text-sm text-musso-pink font-medium hover:underline"
              >
                {showReviewForm ? "Annuler" : "Laisser un avis"}
              </button>
            )}
          </div>

          {/* Formulaire d'avis */}
          {showReviewForm && (
            <div className="bg-gray-50 rounded-card p-4 mb-4">
              <p className="text-sm font-medium mb-2">Votre note</p>
              <StarRating rating={reviewRating} onRate={setReviewRating} interactive size="lg" />
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value.slice(0, 500))}
                placeholder="Partagez votre expérience (optionnel)..."
                rows={3}
                className="w-full mt-3 border-2 border-gray-200 rounded-btn p-3 text-sm focus:border-musso-pink focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{reviewComment.length}/500</p>
              {reviewMutation.error && (
                <p className="text-red-500 text-xs mt-1">{(reviewMutation.error as any)?.message || "Erreur"}</p>
              )}
              <button
                onClick={() => {
                  if (reviewRating === 0) return;
                  reviewMutation.mutate({
                    providerId: id!,
                    rating: reviewRating,
                    comment: reviewComment || undefined,
                  });
                }}
                disabled={reviewRating === 0 || reviewMutation.isPending}
                className="w-full mt-2 h-10 bg-musso-pink text-white rounded-btn text-sm font-semibold hover:brightness-110 disabled:opacity-50"
              >
                {reviewMutation.isPending ? "Envoi..." : "Publier l'avis"}
              </button>
            </div>
          )}

          {/* Liste des avis */}
          {reviews.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-card">
              <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucun avis pour le moment</p>
              {user && user.role !== "PROVIDER" && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="text-sm text-musso-pink font-medium mt-1 hover:underline"
                >
                  Soyez la première à donner votre avis !
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <div key={review.id} className="bg-white rounded-card shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-musso-pink-light flex items-center justify-center">
                        <span className="text-musso-pink text-sm font-bold">{review.clientName[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{review.clientName}</p>
                        <p className="text-xs text-gray-400">{timeAgoReview(review.createdAt)}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal réservation */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowBooking(false)}>
          <div className="bg-black/30 absolute inset-0" />
          <div
            className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading font-bold text-xl mb-4">Réserver un service</h2>

            {provider.services && provider.services.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">Service</label>
                <select
                  value={activeService || ""}
                  onChange={(e) => setActiveService(e.target.value)}
                  className="w-full h-10 border-2 border-gray-200 rounded-btn px-3 text-sm bg-white focus:border-musso-pink focus:outline-none"
                >
                  {provider.services.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.categoryName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1" /> Date souhaitée
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full h-10 border-2 border-gray-200 rounded-btn px-3 text-sm focus:border-musso-pink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  <Clock className="w-4 h-4 inline mr-1" /> Heure souhaitée
                </label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full h-10 border-2 border-gray-200 rounded-btn px-3 text-sm focus:border-musso-pink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Votre numéro</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 h-10 border-2 border-r-0 border-gray-200 rounded-l-btn bg-gray-50 text-sm font-medium text-gray-600">
                    +223
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={8}
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="XX XX XX XX"
                    className="flex-1 h-10 border-2 border-gray-200 rounded-r-btn px-3 text-sm focus:border-musso-pink focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Note (optionnel)</label>
                <textarea
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  placeholder="Précisions sur votre demande..."
                  rows={2}
                  className="w-full border-2 border-gray-200 rounded-btn p-3 text-sm focus:border-musso-pink focus:outline-none resize-none"
                />
              </div>
            </div>

            {bookingError && <p className="text-red-500 text-sm mt-2">{bookingError}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowBooking(false)}
                className="flex-1 h-10 border border-gray-200 rounded-btn text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="flex-1 h-10 bg-musso-pink text-white rounded-btn text-sm font-medium hover:brightness-110 disabled:opacity-50"
              >
                {bookingLoading ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
