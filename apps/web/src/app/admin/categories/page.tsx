"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiPatch } from "@/lib/api";
import { Plus, Edit2, ToggleLeft, ToggleRight } from "lucide-react";

const ICON_OPTIONS = [
  { value: "scissors", label: "Ciseaux" },
  { value: "sparkles", label: "Paillettes" },
  { value: "hand", label: "Main" },
  { value: "shirt", label: "Chemise" },
  { value: "star", label: "Étoile" },
  { value: "home", label: "Maison" },
  { value: "heart", label: "Coeur" },
  { value: "flower", label: "Fleur" },
  { value: "palette", label: "Palette" },
  { value: "brush", label: "Pinceau" },
];

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [iconName, setIconName] = useState("star");
  const [error, setError] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiGet<any[]>("/admin/categories"),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; iconName: string }) => apiPost("/admin/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      resetForm();
    },
    onError: (e: any) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; iconName: string } }) =>
      apiPut(`/admin/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      resetForm();
    },
    onError: (e: any) => setError(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/admin/categories/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setName("");
    setIconName("star");
    setError("");
  };

  const handleEdit = (cat: any) => {
    setEditId(cat.id);
    setName(cat.name);
    setIconName(cat.iconName);
    setShowForm(true);
    setError("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Le nom est obligatoire");
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, data: { name: name.trim(), iconName } });
    } else {
      createMutation.mutate({ name: name.trim(), iconName });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Catégories</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-musso-pink text-white rounded-btn text-sm font-medium hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-card shadow-sm p-4 mb-6">
          <h2 className="font-semibold mb-3">{editId ? "Modifier la catégorie" : "Nouvelle catégorie"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Massage"
                className="w-full h-10 border-2 border-gray-200 rounded-btn px-3 text-sm focus:border-musso-pink focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icône</label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className="w-full h-10 border-2 border-gray-200 rounded-btn px-3 text-sm bg-white focus:border-musso-pink focus:outline-none"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="h-10 px-4 bg-musso-pink text-white rounded-btn text-sm font-medium hover:brightness-110 disabled:opacity-50"
              >
                {editId ? "Modifier" : "Créer"}
              </button>
              <button
                onClick={resetForm}
                className="h-10 px-4 border border-gray-200 rounded-btn text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}

      {/* Liste */}
      <div className="bg-white rounded-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Nom</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Slug</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Icône</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Prestataires</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Statut</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Chargement...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Aucune catégorie</td></tr>
            ) : (
              categories.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-sm">{cat.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{cat.slug}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{cat.iconName}</td>
                  <td className="px-4 py-3 text-sm">{cat.providerCount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(cat.id)}
                        className={`p-1.5 rounded ${cat.isActive ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-600"}`}
                        title={cat.isActive ? "Désactiver" : "Activer"}
                      >
                        {cat.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
