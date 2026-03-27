"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PhoneInput } from "@/components/phone-input";
import { Navbar } from "@/components/navbar";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (phone.length !== 8 || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiPost<any>("/auth/login", {
        phone: `+223${phone}`,
        password,
      });
      login(data.accessToken, data.refreshToken, data.user);
      if (data.isNewUser) {
        router.push("/onboarding");
      } else if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "PROVIDER") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-2xl mb-2">Connexion</h1>
          <p className="text-gray-500">Connectez-vous avec votre numéro et mot de passe</p>
        </div>

        <div className="space-y-4">
          <PhoneInput value={phone} onChange={setPhone} error="" />

          <div>
            <label className="block text-sm font-medium mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full h-12 border-2 border-gray-200 rounded-btn px-4 pr-12 text-sm focus:border-musso-pink focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading || phone.length !== 8 || !password}
            className="w-full h-12 bg-musso-pink text-white font-semibold rounded-btn hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <div className="text-center space-y-2 pt-2">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-musso-pink hover:underline block"
            >
              Mot de passe oublié ?
            </Link>
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{" "}
              <Link href="/auth/register" className="text-musso-pink hover:underline font-medium">
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
