"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { GraduationCap, Trash2, Eye, EyeOff, Users, BookOpen } from "lucide-react";

export default function AdminFormationsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-formations", page],
    queryFn: () => apiGet<any>(`/admin/formations?page=${page}&limit=20`),
  });

  const togglePublishMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/admin/formations/${id}/toggle-publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-formations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/formations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-formations"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-musso-pink" />
          Formations
        </h1>
        <div className="text-sm text-gray-500">
          {data?.total ?? 0} formation{(data?.total ?? 0) > 1 ? "s" : ""} au total
        </div>
      </div>

      <div className="bg-white rounded-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Formation</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Prestataire</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Prix</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Modules</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Inscrits</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Revenus</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Statut</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">Chargement...</td></tr>
            ) : data?.formations?.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">Aucune formation</td></tr>
            ) : (
              data?.formations?.map((f: any) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {f.coverUrl ? (
                          <img src={f.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <span className="font-medium text-sm truncate max-w-[200px]">{f.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{f.providerName}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {f.price === 0 ? <span className="text-green-600">Gratuit</span> : `${f.price.toLocaleString()} F`}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <BookOpen className="w-3.5 h-3.5" /> {f.totalModules}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Users className="w-3.5 h-3.5" /> {f.totalStudents}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">
                    {f.revenue > 0 ? `${f.revenue.toLocaleString()} F` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      f.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {f.isPublished ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => togglePublishMutation.mutate(f.id)}
                        className={`p-1.5 rounded ${f.isPublished ? "hover:bg-gray-100 text-gray-600" : "hover:bg-green-50 text-green-600"}`}
                        title={f.isPublished ? "Dépublier" : "Publier"}
                      >
                        {f.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Supprimer cette formation ?")) deleteMutation.mutate(f.id);
                        }}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
