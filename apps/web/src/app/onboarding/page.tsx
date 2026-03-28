"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { apiGet, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [quartierId, setQuartierId] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: quartiers = [] } = useQuery({
    queryKey: ["quartiers"],
    queryFn: () => apiGet<any[]>("/quartiers"),
  });

  const handleSubmit = async () => {
    if (!name.trim() || !quartierId) return;
    setLoading(true);
    try {
      await apiPut("/users/me", { name: name.trim(), quartierId });
      await refreshUser();
      // Rediriger automatiquement selon le type de compte choisi à l'inscription
      if (user?.accountType === "PROVIDER") {
        router.push("/become-provider");
      } else {
        router.push("/");
      }
    } catch {
      // ignore
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-2xl mb-2">Bienvenue sur Musso Connect !</h1>
          <p className="text-gray-500">Complétez votre profil pour commencer</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Votre nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom complet"
              className="w-full h-12 border-2 border-gray-200 rounded-btn px-4 text-sm focus:border-musso-pink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Votre quartier</label>
            <select
              value={quartierId}
              onChange={(e) => setQuartierId(e.target.value)}
              className="w-full h-12 border-2 border-gray-200 rounded-btn px-4 text-sm bg-white text-gray-700 focus:border-musso-pink focus:outline-none"
            >
              <option value="">Choisir un quartier</option>
              {quartiers.map((q: any) => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !quartierId}
            className="w-full h-12 bg-musso-pink text-white font-semibold rounded-btn hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Continuer"}
          </button>
        </div>
      </div>
    </>
  );
}
