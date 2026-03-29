"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Phone, MessageSquare, Search } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "En attente", color: "text-amber-700", bg: "bg-amber-100" },
  ACCEPTED: { label: "Acceptée", color: "text-green-700", bg: "bg-green-100" },
  REJECTED: { label: "Refusée", color: "text-red-700", bg: "bg-red-100" },
  COMPLETED: { label: "Terminée", color: "text-blue-700", bg: "bg-blue-100" },
  CANCELLED: { label: "Annulée", color: "text-gray-600", bg: "bg-gray-100" },
};

type StatusFilter = "all" | "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showConfirm, setShowConfirm] = useState<{ id: string; action: string } | null>(null);

  const isProvider = user?.role === "PROVIDER";
  const [viewMode, setViewMode] = useState<"received" | "my">(isProvider ? "received" : "my");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", viewMode],
    queryFn: () =>
      apiGet<any[]>(viewMode === "received" ? "/bookings/received" : "/bookings/my"),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) =>
      apiPatch(`/bookings/${id}`, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setShowRejectModal(null);
      setRejectReason("");
      setShowConfirm(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/bookings/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setShowConfirm(null);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">Chargement...</div>
      </>
    );
  }

  if (!user) return null;

  const filteredBookings = statusFilter === "all"
    ? bookings
    : bookings.filter((b: any) => b.status === statusFilter);

  const statusCounts = bookings.reduce((acc: Record<string, number>, b: any) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const filters: { label: string; value: StatusFilter; count?: number }[] = [
    { label: "Toutes", value: "all", count: bookings.length },
    { label: "En attente", value: "PENDING", count: statusCounts.PENDING || 0 },
    { label: "Acceptées", value: "ACCEPTED", count: statusCounts.ACCEPTED || 0 },
    { label: "Terminées", value: "COMPLETED", count: statusCounts.COMPLETED || 0 },
    { label: "Refusées", value: "REJECTED", count: statusCounts.REJECTED || 0 },
    { label: "Annulées", value: "CANCELLED", count: statusCounts.CANCELLED || 0 },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading font-bold text-2xl">
            {viewMode === "received" ? "Réservations reçues" : "Mes réservations"}
          </h1>
          <span className="text-sm text-gray-500">{bookings.length} total</span>
        </div>

        {/* Onglets Reçues / Mes réservations (prestataires uniquement) */}
        {isProvider && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setViewMode("received"); setStatusFilter("all"); }}
              className={`flex-1 py-2.5 rounded-btn text-sm font-semibold transition-colors ${
                viewMode === "received"
                  ? "bg-musso-pink text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Reçues
            </button>
            <button
              onClick={() => { setViewMode("my"); setStatusFilter("all"); }}
              className={`flex-1 py-2.5 rounded-btn text-sm font-semibold transition-colors ${
                viewMode === "my"
                  ? "bg-musso-pink text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Mes réservations
            </button>
          </div>
        )}

        {/* Stats rapides */}
        {bookings.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-amber-50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-amber-700">{statusCounts.PENDING || 0}</p>
              <p className="text-xs text-amber-600">En attente</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-green-700">{statusCounts.ACCEPTED || 0}</p>
              <p className="text-xs text-green-600">Acceptées</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-blue-700">{statusCounts.COMPLETED || 0}</p>
              <p className="text-xs text-blue-600">Terminées</p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === f.value
                  ? "bg-musso-pink text-white"
                  : "bg-white border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label} {f.count! > 0 && <span className="opacity-70">({f.count})</span>}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-card shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-card shadow-sm">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">
              {statusFilter !== "all" ? "Aucune réservation avec ce statut" : "Aucune réservation pour le moment"}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {viewMode === "received"
                ? "Les clients pourront vous réserver depuis votre profil"
                : "Trouvez une prestataire et réservez un service"}
            </p>
            {viewMode === "my" && (
              <Link
                href="/search"
                className="inline-flex items-center gap-1 text-musso-pink hover:underline text-sm font-medium"
              >
                <Search className="w-4 h-4" /> Rechercher une prestataire
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking: any) => {
              const st = statusConfig[booking.status] || statusConfig.PENDING;
              const isPast = new Date(booking.requestedDate) < new Date();
              return (
                <div key={booking.id} className="bg-white rounded-card shadow-sm overflow-hidden">
                  {/* En-tête coloré */}
                  <div className={`px-4 py-2 ${st.bg} flex items-center justify-between`}>
                    <span className={`text-xs font-semibold ${st.color}`}>{st.label}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Info principale */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-base">
                          {viewMode === "received" ? booking.clientName : booking.providerName}
                        </h3>
                        <p className="text-sm text-musso-pink font-medium mt-0.5">{booking.serviceName}</p>
                      </div>
                      {viewMode === "my" && booking.providerAvatar && (
                        <div className="w-10 h-10 rounded-full bg-musso-pink-light overflow-hidden flex-shrink-0">
                          <img src={booking.providerAvatar} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Date et heure */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-musso-pink" />
                          <span className="font-medium">{formatDate(booking.requestedDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-musso-pink" />
                          <span className="font-medium">{booking.requestedTime}</span>
                        </div>
                      </div>
                      {isPast && booking.status === "PENDING" && (
                        <p className="text-xs text-amber-600 mt-1.5">Cette date est passée</p>
                      )}
                    </div>

                    {/* Note du client */}
                    {booking.note && (
                      <div className="flex gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600">{booking.note}</p>
                      </div>
                    )}

                    {/* Motif de refus */}
                    {booking.rejectionReason && (
                      <div className="bg-red-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-medium text-red-700 mb-0.5">Motif du refus :</p>
                        <p className="text-sm text-red-600">{booking.rejectionReason}</p>
                      </div>
                    )}

                    {/* Contact (prestataire voit le tel du client) */}
                    {viewMode === "received" && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{booking.clientPhone}</span>
                      </div>
                    )}

                    {/* Actions prestataire (uniquement dans l'onglet "Reçues") */}
                    {viewMode === "received" && booking.status === "PENDING" && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setShowConfirm({ id: booking.id, action: "accept" })}
                          className="flex-1 h-10 bg-green-600 text-white rounded-btn text-sm font-medium flex items-center justify-center gap-1.5 hover:brightness-110"
                        >
                          <CheckCircle className="w-4 h-4" /> Accepter
                        </button>
                        <button
                          onClick={() => setShowRejectModal(booking.id)}
                          className="flex-1 h-10 bg-red-600 text-white rounded-btn text-sm font-medium flex items-center justify-center gap-1.5 hover:brightness-110"
                        >
                          <XCircle className="w-4 h-4" /> Refuser
                        </button>
                      </div>
                    )}

                    {viewMode === "received" && booking.status === "ACCEPTED" && (
                      <button
                        onClick={() => setShowConfirm({ id: booking.id, action: "complete" })}
                        className="w-full h-10 bg-blue-600 text-white rounded-btn text-sm font-medium hover:brightness-110 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" /> Marquer comme terminée
                      </button>
                    )}

                    {/* Actions client (onglet "Mes réservations") */}
                    {viewMode === "my" && booking.status === "PENDING" && (
                      <button
                        onClick={() => setShowConfirm({ id: booking.id, action: "cancel" })}
                        className="w-full h-10 border border-red-300 text-red-600 rounded-btn text-sm font-medium hover:bg-red-50 flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Annuler la réservation
                      </button>
                    )}

                    {/* Message de suivi pour le client */}
                    {viewMode === "my" && booking.status === "ACCEPTED" && (
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-sm text-green-700 font-medium">Réservation confirmée !</p>
                        <p className="text-xs text-green-600 mt-0.5">La prestataire a accepté. Présentez-vous à la date prévue.</p>
                      </div>
                    )}

                    {viewMode === "my" && booking.status === "COMPLETED" && (
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-sm text-blue-700 font-medium">Service terminé</p>
                        <p className="text-xs text-blue-600 mt-0.5">Merci d&apos;avoir utilisé Musso Connect !</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale de refus */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowRejectModal(null)}>
          <div className="bg-black/30 absolute inset-0" />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-lg mb-1">Refuser la réservation</h3>
            <p className="text-sm text-gray-500 mb-4">Expliquez au client pourquoi vous ne pouvez pas accepter.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Je ne suis pas disponible ce jour-là..."
              rows={3}
              className="w-full border-2 border-gray-200 rounded-btn p-3 text-sm focus:border-musso-pink focus:outline-none resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason(""); }}
                className="flex-1 h-10 border border-gray-200 rounded-btn text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => updateMutation.mutate({ id: showRejectModal, status: "REJECTED", rejectionReason: rejectReason || undefined })}
                disabled={updateMutation.isPending}
                className="flex-1 h-10 bg-red-600 text-white rounded-btn text-sm font-medium hover:brightness-110 disabled:opacity-50"
              >
                {updateMutation.isPending ? "..." : "Confirmer le refus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowConfirm(null)}>
          <div className="bg-black/30 absolute inset-0" />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
            {showConfirm.action === "accept" && (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-1">Accepter cette réservation ?</h3>
                <p className="text-sm text-gray-500 mb-4">Le client sera notifié que vous avez accepté.</p>
              </>
            )}
            {showConfirm.action === "complete" && (
              <>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-1">Marquer comme terminée ?</h3>
                <p className="text-sm text-gray-500 mb-4">Confirmez que le service a été rendu.</p>
              </>
            )}
            {showConfirm.action === "cancel" && (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-1">Annuler cette réservation ?</h3>
                <p className="text-sm text-gray-500 mb-4">Cette action est irréversible.</p>
              </>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 h-10 border border-gray-200 rounded-btn text-sm font-medium hover:bg-gray-50"
              >
                Non
              </button>
              <button
                onClick={() => {
                  if (showConfirm.action === "accept") {
                    updateMutation.mutate({ id: showConfirm.id, status: "ACCEPTED" });
                  } else if (showConfirm.action === "complete") {
                    updateMutation.mutate({ id: showConfirm.id, status: "COMPLETED" });
                  } else if (showConfirm.action === "cancel") {
                    cancelMutation.mutate(showConfirm.id);
                  }
                }}
                disabled={updateMutation.isPending || cancelMutation.isPending}
                className={`flex-1 h-10 text-white rounded-btn text-sm font-medium hover:brightness-110 disabled:opacity-50 ${
                  showConfirm.action === "cancel" ? "bg-red-600" : showConfirm.action === "complete" ? "bg-blue-600" : "bg-green-600"
                }`}
              >
                {updateMutation.isPending || cancelMutation.isPending ? "..." : "Oui, confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
