"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PhoneInput } from "@/components/phone-input";
import { Navbar } from "@/components/navbar";
import { Eye, EyeOff, User, Briefcase } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<"FREE" | "PROVIDER">("FREE");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name.trim() || phone.length !== 8 || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await apiPost<any>("/auth/register", {
        phone: `+223${phone}`,
        password,
        name: name.trim(),
        accountType,
      });
      login(data.accessToken, data.refreshToken, data.user);
      router.push("/onboarding");
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
        <div className="text-center mb-6">
          <h1 className="font-heading font-bold text-2xl mb-2">Créer un compte</h1>
          <p className="text-gray-500">Rejoignez Musso Connect</p>
        </div>

        <div className="space-y-4">
          {/* Type de compte */}
          <div>
            <label className="block text-sm font-medium mb-2">Type de compte</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAccountType("FREE")}
                className={`p-4 rounded-btn border-2 text-left transition-colors ${
                  accountType === "FREE"
                    ? "border-musso-pink bg-musso-pink-light"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <User className={`w-5 h-5 mb-1 ${accountType === "FREE" ? "text-musso-pink" : "text-gray-400"}`} />
                <p className="font-medium text-sm">Client</p>
                <p className="text-xs text-gray-500">Gratuit - Rechercher et réserver</p>
              </button>
              <button
                onClick={() => setAccountType("PROVIDER")}
                className={`p-4 rounded-btn border-2 text-left transition-colors ${
                  accountType === "PROVIDER"
                    ? "border-musso-pink bg-musso-pink-light"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Briefcase className={`w-5 h-5 mb-1 ${accountType === "PROVIDER" ? "text-musso-pink" : "text-gray-400"}`} />
                <p className="font-medium text-sm">Prestataire</p>
                <p className="text-xs text-gray-500">Proposer vos services</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nom complet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom complet"
              className="w-full h-12 border-2 border-gray-200 rounded-btn px-4 text-sm focus:border-musso-pink focus:outline-none"
            />
          </div>

          <PhoneInput value={phone} onChange={setPhone} error="" />

          <div>
            <label className="block text-sm font-medium mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="w-full h-12 border-2 border-gray-200 rounded-btn px-4 pr-12 text-sm focus:border-musso-pink focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez votre mot de passe"
              className="w-full h-12 border-2 border-gray-200 rounded-btn px-4 text-sm focus:border-musso-pink focus:outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            onClick={handleRegister}
            disabled={loading || !name.trim() || phone.length !== 8 || !password || !confirmPassword}
            className="w-full h-12 bg-musso-pink text-white font-semibold rounded-btn hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>

          <p className="text-sm text-gray-500 text-center">
            Déjà un compte ?{" "}
            <Link href="/auth/login" className="text-musso-pink hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
