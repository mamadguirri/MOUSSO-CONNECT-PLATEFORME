"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { apiGet, apiPostForm } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";

export default function BecomeProviderPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bio, setBio] = useState("");

  // Step 2
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Step 3
  const [quartierId, setQuartierId] = useState(user?.quartierId || "");
  const [priceRange, setPriceRange] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<any[]>("/categories"),
  });

  const { data: quartiers = [] } = useQuery({
    queryKey: ["quartiers"],
    queryFn: () => apiGet<any[]>("/quartiers"),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", user?.name || "");
      formData.append("bio", bio);
      formData.append("whatsappNumber", `+223${whatsappNumber}`);
      formData.append("quartierId", quartierId);
      selectedCategories.forEach((id) => formData.append("categoryIds", id));
      if (priceRange) formData.append("priceRange", priceRange);
      if (avatar) formData.append("avatar", avatar);

      await apiPostForm("/providers", formData);
      await refreshUser();
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="font-heading font-bold text-2xl mb-2 text-center">Créer mon profil prestataire</h1>

        {/* Barre de progression */}
        <div className="flex items-center gap-2 mb-8 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? "bg-musso-pink" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-btn text-sm mb-4">{error}</div>
        )}

        {/* Étape 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <label className="cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-musso-pink-light flex items-center justify-center overflow-hidden mx-auto mb-2">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-musso-pink text-sm">+ Photo</span>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <span className="text-sm text-musso-pink">Ajouter une photo</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bio / Description</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                placeholder="Décrivez vos services et votre expérience..."
                rows={4}
                className="w-full border-2 border-gray-200 rounded-btn p-3 text-sm focus:border-musso-pink focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{bio.length}/500</p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full h-12 bg-musso-pink text-white font-semibold rounded-btn hover:brightness-110 transition-all"
            >
              Suivant
            </button>
          </div>
        )}

        {/* Étape 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Vos catégories de services</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-btn border-2 text-sm text-left transition-colors ${
                      selectedCategories.includes(cat.id)
                        ? "border-musso-pink bg-musso-pink-light text-musso-pink"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Numéro WhatsApp</label>
              <div className="flex">
                <span className="inline-flex items-center px-4 h-12 border-2 border-r-0 border-gray-200 rounded-l-btn bg-gray-50 text-sm font-medium text-gray-600">
                  +223
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="XX XX XX XX"
                  maxLength={8}
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="flex-1 h-12 border-2 border-gray-200 rounded-r-btn px-4 text-sm focus:border-musso-pink focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 h-12 border-2 border-gray-200 font-semibold rounded-btn hover:bg-gray-50">
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedCategories.length === 0 || whatsappNumber.length !== 8}
                className="flex-1 h-12 bg-musso-pink text-white font-semibold rounded-btn hover:brightness-110 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Étape 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Quartier</label>
              <select
                value={quartierId}
                onChange={(e) => setQuartierId(e.target.value)}
                className="w-full h-12 border-2 border-gray-200 rounded-btn px-4 text-sm bg-white focus:border-musso-pink focus:outline-none"
              >
                <option value="">Choisir un quartier</option>
                {quartiers.map((q: any) => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Gamme de prix (optionnel)</label>
              <input
                type="text"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder="Ex: 5 000 - 25 000 FCFA"
                className="w-full h-12 border-2 border-gray-200 rounded-btn px-4 text-sm focus:border-musso-pink focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 h-12 border-2 border-gray-200 font-semibold rounded-btn hover:bg-gray-50">
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !quartierId}
                className="flex-1 h-12 bg-musso-pink text-white font-semibold rounded-btn hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Création..." : "Créer mon profil"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
