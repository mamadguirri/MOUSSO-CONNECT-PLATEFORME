"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { UserX, UserCheck } from "lucide-react";

type RoleFilter = "all" | "CLIENT" | "PROVIDER" | "ADMIN";

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (roleFilter !== "all") params.set("role", roleFilter);
  params.set("page", page.toString());
  params.set("limit", "20");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter, page],
    queryFn: () => apiGet<any>(`/admin/users?${params.toString()}`),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/admin/users/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const filters: { label: string; value: RoleFilter }[] = [
    { label: "Tous", value: "all" },
    { label: "Clients", value: "CLIENT" },
    { label: "Prestataires", value: "PROVIDER" },
    { label: "Admins", value: "ADMIN" },
  ];

  const roleLabels: Record<string, { label: string; color: string }> = {
    CLIENT: { label: "Client", color: "bg-blue-100 text-blue-700" },
    PROVIDER: { label: "Prestataire", color: "bg-purple-100 text-purple-700" },
    ADMIN: { label: "Admin", color: "bg-red-100 text-red-700" },
  };

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Utilisateurs</h1>

      <div className="flex gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setRoleFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors ${
              roleFilter === f.value
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
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Nom</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Téléphone</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Rôle</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Compte</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Quartier</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Statut</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Inscrit le</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">Chargement...</td></tr>
            ) : data?.users?.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">Aucun utilisateur</td></tr>
            ) : (
              data?.users?.map((u: any) => {
                const role = roleLabels[u.role] || roleLabels.CLIENT;
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-sm">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.phone}</td>
                    <td className="px-4 py-3">
                      <Badge className={role.color}>{role.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.accountType === "PROVIDER" ? "Prestataire" : "Gratuit"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.quartierName || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => toggleMutation.mutate(u.id)}
                          className={`p-1.5 rounded ${u.isActive ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-600"}`}
                          title={u.isActive ? "Désactiver" : "Activer"}
                        >
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
