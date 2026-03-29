"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete } from "@/lib/api";
import { Star, Trash2 } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", page],
    queryFn: () => apiGet<any>(`/admin/reviews?page=${page}&limit=20`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/reviews/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
          <Star className="w-7 h-7 text-yellow-500" />
          Avis clients
        </h1>
        <div className="text-sm text-gray-500">
          {data?.total ?? 0} avis au total
        </div>
      </div>

      <div className="bg-white rounded-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Client</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Prestataire</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Note</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Commentaire</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Chargement...</td></tr>
            ) : data?.reviews?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Aucun avis</td></tr>
            ) : (
              data?.reviews?.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{r.clientName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.providerName}</td>
                  <td className="px-4 py-3">
                    <StarRating rating={r.rating} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[300px] truncate">
                    {r.comment || <span className="text-gray-400 italic">Pas de commentaire</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm("Supprimer cet avis ?")) deleteMutation.mutate(r.id);
                      }}
                      className="p-1.5 rounded hover:bg-red-50 text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
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
