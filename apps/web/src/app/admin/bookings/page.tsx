"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

type StatusFilter = "all" | "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  ACCEPTED: { label: "Acceptée", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Refusée", color: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Terminée", color: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "Annulée", color: "bg-gray-100 text-gray-600" },
};

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (statusFilter !== "all") params.set("status", statusFilter);
  params.set("page", page.toString());
  params.set("limit", "20");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings", statusFilter, page],
    queryFn: () => apiGet<any>(`/admin/bookings?${params.toString()}`),
  });

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "Toutes", value: "all" },
    { label: "En attente", value: "PENDING" },
    { label: "Acceptées", value: "ACCEPTED" },
    { label: "Terminées", value: "COMPLETED" },
    { label: "Refusées", value: "REJECTED" },
    { label: "Annulées", value: "CANCELLED" },
  ];

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Réservations</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-musso-pink text-white"
                : "bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Client</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Prestataire</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Service</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Heure</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Statut</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Créée le</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">Chargement...</td></tr>
            ) : data?.bookings?.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">Aucune réservation</td></tr>
            ) : (
              data?.bookings?.map((b: any) => {
                const st = statusLabels[b.status] || statusLabels.PENDING;
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div>{b.clientName}</div>
                      <div className="text-xs text-gray-400">{b.clientPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{b.providerName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">{b.serviceName}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(b.requestedDate).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-sm">{b.requestedTime}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(b.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-btn text-sm ${page === p ? "bg-musso-pink text-white" : "bg-white border border-gray-200 hover:bg-gray-50"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
