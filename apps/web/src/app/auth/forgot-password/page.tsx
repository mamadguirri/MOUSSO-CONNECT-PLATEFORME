"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { apiPost } from "@/lib/api";
import { PhoneInput } from "@/components/phone-input";
import { OtpInput } from "@/components/otp-input";
import { Navbar } from "@/components/navbar";
import { Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "newPassword">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const handleRequestOtp = async () => {
    if (phone.length !== 8) {
      setError("Veuillez saisir un numéro à 8 chiffres");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiPost<any>("/auth/request-reset", { phone: `+223${phone}` });
      if (data?.devOtp) setDevOtp(data.devOtp);
      setStep("otp");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (otp.length !== 6) return;
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiPost("/auth/reset-password", {
        phone: `+223${phone}`,
        code: otp,
        newPassword,
      });
      setSuccess("Mot de passe réinitialisé ! Vous pouvez vous connecter.");
      setTimeout(() => router.push("/auth/login"), 2000);
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
          <h1 className="font-heading font-bold text-2xl mb-2">Mot de passe oublié</h1>
          <p className="text-gray-500">
            {step === "phone" && "Saisissez votre numéro pour recevoir un code SMS"}
            {step === "otp" && "Saisissez le code reçu et votre nouveau mot de passe"}
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 text-green-600 p-4 rounded-btn text-center">
            {success}
          </div>
        ) : step === "phone" ? (
          <div className="space-y-4">
            <PhoneInput value={phone} onChange={setPhone} error={error} />
            <button
              onClick={handleRequestOtp}
              disabled={loading || phone.length !== 8}
              className="w-full h-12 bg-musso-pink text-white font-semibold rounded-btn hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Recevoir le code SMS"}
            </button>
            <Link href="/auth/login" className="block text-sm text-center text-gray-500 hover:text-musso-pink">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-500">Code envoyé au +223 {phone}</p>
            {devOtp && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-btn text-center text-sm">
                <p className="font-medium">Mode développement</p>
                <p>Votre code OTP : <span className="font-bold text-lg">{devOtp}</span></p>
              </div>
            )}
            <OtpInput value={otp} onChange={setOtp} />

            <div>
              <label htmlFor="forgot-new-password" className="block text-sm font-medium mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  id="forgot-new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full h-12 border-2 border-gray-200 rounded-btn px-4 pr-12 text-sm focus:border-musso-pink focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Afficher/masquer le mot de passe"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="forgot-confirm-password" className="block text-sm font-medium mb-1.5">Confirmer</label>
              <input
                id="forgot-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                className="w-full h-12 border-2 border-gray-200 rounded-btn px-4 text-sm focus:border-musso-pink focus:outline-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              onClick={handleVerifyAndReset}
              disabled={loading || otp.length !== 6 || !newPassword || !confirmPassword}
              className="w-full h-12 bg-musso-pink text-white font-semibold rounded-btn hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </button>

            <button
              onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
              className="w-full text-sm text-gray-500 hover:text-musso-pink"
            >
              Changer de numéro
            </button>
          </div>
        )}
      </div>
    </>
  );
}
