"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  ACCEPTED: { label: "Acceptée", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Refusée", color: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Terminée", color: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "Annulée", color: "bg-gray-100 text-gray-700" },
};

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isProvider = user?.role === "PROVIDER";

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", isProvider ? "received" : "my"],
    queryFn: () =>
      apiGet<any[]>(isProvider ? "/bookings/received" : "/bookings/my"),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) =>
      apiPatch(`/bookings/${id}`, { status, rejectionReason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/bookings/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  if (authLoading) {
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

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-heading font-bold text-2xl mb-6">
          {isProvider ? "Réservations reçues" : "Mes réservations"}
        </h1>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune réservation pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: any) => {
              const st = statusLabels[booking.status] || statusLabels.PENDING;
              return (
                <div key={booking.id} className="bg-white rounded-card shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">
                        {isProvider ? booking.clientName : booking.providerName}
                      </h3>
                      <p className="text-sm text-musso-pink font-medium">{booking.serviceName}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(booking.requestedDate).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {booking.requestedTime}
                    </span>
                  </div>

                  {booking.note && (
                    <p className="text-sm text-gray-500 mb-3 bg-gray-50 p-2 rounded">{booking.note}</p>
                  )}

                  {booking.rejectionReason && (
                    <p className="text-sm text-red-500 mb-3">Motif : {booking.rejectionReason}</p>
                  )}

                  {isProvider && booking.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMutation.mutate({ id: booking.id, status: "ACCEPTED" })}
                        className="flex-1 h-9 bg-green-600 text-white rounded-btn text-sm font-medium flex items-center justify-center gap-1 hover:brightness-110"
                      >
                        <CheckCircle className="w-4 h-4" /> Accepter
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt("Motif du refus (optionnel) :");
                          updateMutation.mutate({ id: booking.id, status: "REJECTED", rejectionReason: reason || undefined });
                        }}
                        className="flex-1 h-9 bg-red-600 text-white rounded-btn text-sm font-medium flex items-center justify-center gap-1 hover:brightness-110"
                      >
                        <XCircle className="w-4 h-4" /> Refuser
                      </button>
                    </div>
                  )}

                  {isProvider && booking.status === "ACCEPTED" && (
                    <button
                      onClick={() => updateMutation.mutate({ id: booking.id, status: "COMPLETED" })}
                      className="w-full h-9 bg-blue-600 text-white rounded-btn text-sm font-medium hover:brightness-110"
                    >
                      Marquer comme terminée
                    </button>
                  )}

                  {!isProvider && booking.status === "PENDING" && (
                    <button
                      onClick={() => cancelMutation.mutate(booking.id)}
                      className="w-full h-9 border border-red-300 text-red-600 rounded-btn text-sm font-medium hover:bg-red-50"
                    >
                      Annuler la réservation
                    </button>
                  )}

                  {isProvider && booking.status === "PENDING" && (
                    <p className="text-xs text-gray-400 mt-2">Tel: {booking.clientPhone}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
