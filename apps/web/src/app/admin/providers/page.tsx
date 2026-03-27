"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

type StatusFilter = "all" | "pending" | "verified" | "suspended";

export default function AdminProvidersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (statusFilter !== "all") params.set("status", statusFilter);
  params.set("page", page.toString());
  params.set("limit", "20");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-providers", statusFilter, page],
    queryFn: () => apiGet<any>(`/admin/providers?${params.toString()}`),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/admin/providers/${id}/verify`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-providers"] }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      apiPatch(`/admin/providers/${id}/suspend`, { suspended }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-providers"] }),
  });

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "Tous", value: "all" },
    { label: "En attente", value: "pending" },
    { label: "Vérifiés", value: "verified" },
    { label: "Suspendus", value: "suspended" },
  ];

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Prestataires</h1>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
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

      {/* Table */}
      <div className="bg-white rounded-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Nom</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Téléphone</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Catégories</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Quartier</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Statut</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Chargement...</td></tr>
            ) : data?.providers?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Aucun prestataire</td></tr>
            ) : (
              data?.providers?.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedProvider(p)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-musso-pink-light flex items-center justify-center overflow-hidden">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-musso-pink text-xs font-bold">{p.name[0]}</span>
                        )}
                      </div>
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.categories.map((c: any) => (
                        <Badge key={c.slug} variant="secondary" className="text-xs">{c.name}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.quartierName || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge isVerified={p.isVerified} isSuspended={p.isSuspended} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {!p.isVerified && !p.isSuspended && (
                        <button
                          onClick={() => verifyMutation.mutate(p.id)}
                          className="p-1.5 rounded hover:bg-green-50 text-green-600"
                          title="Vérifier"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => suspendMutation.mutate({ id: p.id, suspended: !p.isSuspended })}
                        className={`p-1.5 rounded ${p.isSuspended ? "hover:bg-green-50 text-green-600" : "hover:bg-red-50 text-red-600"}`}
                        title={p.isSuspended ? "Réactiver" : "Suspendre"}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Panneau latéral */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedProvider(null)}>
          <div className="bg-black/30 absolute inset-0" />
          <div
            className="relative bg-white w-full max-w-md shadow-xl overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProvider(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-full bg-musso-pink-light flex items-center justify-center overflow-hidden mx-auto mb-3">
                {selectedProvider.avatarUrl ? (
                  <img src={selectedProvider.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-musso-pink text-2xl font-bold">{selectedProvider.name[0]}</span>
                )}
              </div>
              <h2 className="font-heading font-bold text-xl">{selectedProvider.name}</h2>
              <p className="text-sm text-gray-500">{selectedProvider.phone}</p>
              <div className="mt-2">
                <StatusBadge isVerified={selectedProvider.isVerified} isSuspended={selectedProvider.isSuspended} />
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Quartier :</span> {selectedProvider.quartierName || "—"}
              </div>
              <div>
                <span className="font-medium">WhatsApp :</span> {selectedProvider.whatsappNumber}
              </div>
              <div>
                <span className="font-medium">Bio :</span> {selectedProvider.bio || "—"}
              </div>
              <div>
                <span className="font-medium">Catégories :</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedProvider.categories.map((c: any) => (
                    <Badge key={c.slug} className="bg-musso-pink-light text-musso-pink">{c.name}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium">Inscrit le :</span>{" "}
                {new Date(selectedProvider.createdAt).toLocaleDateString("fr-FR")}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              {!selectedProvider.isVerified && !selectedProvider.isSuspended && (
                <button
                  onClick={() => { verifyMutation.mutate(selectedProvider.id); setSelectedProvider(null); }}
                  className="flex-1 h-10 bg-green-600 text-white rounded-btn text-sm font-medium hover:brightness-110"
                >
                  Vérifier
                </button>
              )}
              <button
                onClick={() => {
                  suspendMutation.mutate({ id: selectedProvider.id, suspended: !selectedProvider.isSuspended });
                  setSelectedProvider(null);
                }}
                className={`flex-1 h-10 rounded-btn text-sm font-medium ${
                  selectedProvider.isSuspended
                    ? "bg-green-600 text-white hover:brightness-110"
                    : "bg-red-600 text-white hover:brightness-110"
                }`}
              >
                {selectedProvider.isSuspended ? "Réactiver" : "Suspendre"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
