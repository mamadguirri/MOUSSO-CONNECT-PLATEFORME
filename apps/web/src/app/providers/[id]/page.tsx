"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Clock } from "lucide-react";

import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { PhotoGallery } from "@/components/photo-gallery";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProviderPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [activeService, setActiveService] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider", id],
    queryFn: () => apiGet<any>(`/providers/${id}`),
  });

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

  const selectedService = activeService
    ? provider.services?.find((s: any) => s.id === activeService)
    : null;

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/search" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-musso-pink mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        {/* Profil */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-musso-pink-light flex items-center justify-center overflow-hidden mx-auto mb-3">
            {provider.avatarUrl ? (
              <img src={provider.avatarUrl} alt={provider.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-musso-pink text-3xl font-bold">{provider.name[0]}</span>
            )}
          </div>
          <h1 className="font-heading font-bold text-2xl">{provider.name}</h1>
          {provider.quartierName && (
            <p className="text-gray-500 flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-4 h-4" /> {provider.quartierName}, Bamako
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <WhatsAppButton
            phone={provider.whatsappNumber}
            providerName={provider.name}
            category={provider.categories?.[0]?.name}
            className="flex-1"
          />
          <button
            onClick={() => {
              if (!user) { router.push("/auth/login"); return; }
              if (provider.services?.length > 0) {
                setActiveService(provider.services[0].id);
              }
              setShowBooking(true);
            }}
            className="flex-1 h-12 bg-musso-pink text-white font-semibold rounded-btn hover:brightness-110 flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" /> Réserver
          </button>
        </div>

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
                <div key={service.id} className="bg-white rounded-card shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-musso-pink-light text-musso-pink">{service.categoryName}</Badge>
                      {service.priceRange && (
                        <span className="text-sm text-gray-500">{service.priceRange}</span>
                      )}
                    </div>
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  )}
                  {service.photos && service.photos.length > 0 && (
                    <PhotoGallery photos={service.photos} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backward compat: flat photos */}
        {(!provider.services || provider.services.length === 0) && provider.photos?.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold text-lg mb-2">Galerie</h2>
            <PhotoGallery photos={provider.photos} />
          </div>
        )}
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
