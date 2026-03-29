"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Upload, GraduationCap, BookOpen, Image as ImageIcon, Video, FileText, Eye, EyeOff } from "lucide-react";

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function CreateFormationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<"info" | "modules">("info");
  const [formationId, setFormationId] = useState<string | null>(null);

  // Formulaire info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  // Création formation
  const createMutation = useMutation({
    mutationFn: () => apiPost<any>("/formations", { title, description, price: parseInt(price) || 0 }),
    onSuccess: (data) => {
      setFormationId(data.id);
      setStep("modules");
    },
  });

  // Charger la formation avec ses modules
  const { data: formation, refetch } = useQuery({
    queryKey: ["formation-edit", formationId],
    queryFn: () => apiGet<any>(`/formations/${formationId}`),
    enabled: !!formationId,
  });

  // Module
  const [moduleTitle, setModuleTitle] = useState("");
  const addModuleMutation = useMutation({
    mutationFn: () => apiPost(`/formations/${formationId}/modules`, { title: moduleTitle }),
    onSuccess: () => {
      setModuleTitle("");
      refetch();
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => apiDelete(`/formations/modules/${moduleId}`),
    onSuccess: () => refetch(),
  });

  // Upload média
  const uploadMediaMutation = useMutation({
    mutationFn: async ({ moduleId, file }: { moduleId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/formations/modules/${moduleId}/medias`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload échoué");
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) => apiDelete(`/formations/medias/${mediaId}`),
    onSuccess: () => refetch(),
  });

  // Publier
  const publishMutation = useMutation({
    mutationFn: (publish: boolean) => apiPut(`/formations/${formationId}`, { isPublished: publish }),
    onSuccess: () => refetch(),
  });

  // Upload cover
  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await fetch(`${API_BASE}/formations/${formationId}/cover`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload échoué");
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  if (!user || user.role !== "PROVIDER") {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h2 className="font-heading font-bold text-xl mb-2">Accès réservé aux prestataires</h2>
          <Link href="/formations" className="text-musso-pink hover:underline">Retour aux formations</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href="/formations" className="text-sm text-gray-500 hover:text-musso-pink flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour aux formations
        </Link>

        <h1 className="font-heading font-bold text-2xl mb-6 flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-musso-pink" />
          {step === "info" ? "Créer une formation" : "Ajouter le contenu"}
        </h1>

        {/* ÉTAPE 1 : Informations */}
        {step === "info" && (
          <div className="bg-white rounded-card shadow-sm p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre de la formation *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Tresses africaines pour débutantes"
                  className="w-full h-12 rounded-btn border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-musso-pink"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez ce que les élèves vont apprendre..."
                  rows={4}
                  className="w-full rounded-btn border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-musso-pink resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix (FCFA) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0 pour gratuit"
                  min="0"
                  className="w-full h-12 rounded-btn border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-musso-pink"
                />
                <p className="text-xs text-gray-400 mt-1">Mettez 0 pour une formation gratuite</p>
              </div>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!title.trim() || createMutation.isPending}
                className="w-full h-12 bg-musso-pink text-white rounded-btn font-semibold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? "Création..." : "Continuer →"}
              </button>
              {createMutation.isError && (
                <p className="text-sm text-red-500">{(createMutation.error as any)?.message || "Erreur"}</p>
              )}
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : Modules & Contenu */}
        {step === "modules" && formation && (
          <div className="space-y-6">
            {/* Cover */}
            <div className="bg-white rounded-card shadow-sm p-6">
              <h3 className="font-semibold mb-3">Image de couverture</h3>
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                  {formation.coverUrl ? (
                    <img src={formation.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-btn text-sm font-medium transition-all">
                  <Upload className="w-4 h-4 inline mr-1" />
                  {formation.coverUrl ? "Changer" : "Ajouter"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadCoverMutation.mutate(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            {/* Ajouter un module */}
            <div className="bg-white rounded-card shadow-sm p-6">
              <h3 className="font-semibold mb-3">Modules / Chapitres</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Titre du module (ex: Introduction)"
                  className="flex-1 h-10 rounded-btn border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-musso-pink"
                  onKeyDown={(e) => e.key === "Enter" && moduleTitle.trim() && addModuleMutation.mutate()}
                />
                <button
                  onClick={() => addModuleMutation.mutate()}
                  disabled={!moduleTitle.trim() || addModuleMutation.isPending}
                  className="h-10 px-4 bg-musso-pink text-white rounded-btn text-sm font-semibold hover:brightness-110 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Liste des modules */}
              {formation.modules?.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <BookOpen className="w-8 h-8 mx-auto mb-2" />
                  Ajoutez votre premier module
                </div>
              ) : (
                <div className="space-y-4">
                  {formation.modules?.map((module: any, idx: number) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-musso-pink text-white flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                          <h4 className="font-semibold text-sm">{module.title}</h4>
                        </div>
                        <button
                          onClick={() => deleteModuleMutation.mutate(module.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Médias du module */}
                      {module.medias?.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {module.medias.map((media: any) => (
                            <div key={media.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 text-sm">
                                {media.type === "VIDEO" && <Video className="w-4 h-4 text-blue-500" />}
                                {media.type === "IMAGE" && <ImageIcon className="w-4 h-4 text-green-500" />}
                                {media.type === "DOCUMENT" && <FileText className="w-4 h-4 text-orange-500" />}
                                <span className="truncate max-w-[200px]">{media.name || media.type}</span>
                              </div>
                              <button
                                onClick={() => deleteMediaMutation.mutate(media.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload média */}
                      <label className="cursor-pointer flex items-center gap-2 text-sm text-musso-pink hover:underline">
                        <Upload className="w-4 h-4" />
                        Ajouter un fichier (image, vidéo, document)
                        <input
                          type="file"
                          accept="image/*,video/*,.pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadMediaMutation.mutate({ moduleId: module.id, file });
                          }}
                        />
                      </label>
                      {uploadMediaMutation.isPending && (
                        <p className="text-xs text-gray-400 mt-1">Upload en cours...</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => publishMutation.mutate(!formation.isPublished)}
                disabled={publishMutation.isPending}
                className={`flex-1 h-12 rounded-btn font-semibold transition-all flex items-center justify-center gap-2 ${
                  formation.isPublished
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {formation.isPublished ? (
                  <><EyeOff className="w-4 h-4" /> Dépublier</>
                ) : (
                  <><Eye className="w-4 h-4" /> Publier la formation</>
                )}
              </button>
              <button
                onClick={() => router.push(`/formations/${formationId}`)}
                className="flex-1 h-12 bg-musso-pink text-white rounded-btn font-semibold hover:brightness-110 transition-all"
              >
                Voir la formation →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
