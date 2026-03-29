"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import {
  Users, UserCheck, Clock, Calendar, Tag, AlertCircle,
  GraduationCap, Star, MessageCircle, TrendingUp, ShoppingCart,
} from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiGet<any>("/admin/stats"),
  });

  const mainCards = [
    { label: "Total utilisateurs", value: stats?.totalUsers ?? "—", icon: Users, color: "bg-blue-50 text-blue-600 border-blue-100", href: "/admin/users" },
    { label: "Total prestataires", value: stats?.totalProviders ?? "—", icon: UserCheck, color: "bg-purple-50 text-purple-600 border-purple-100", href: "/admin/providers" },
    { label: "En attente de vérification", value: stats?.pendingProviders ?? "—", icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-100", href: "/admin/providers" },
    { label: "Prestataires vérifiés", value: stats?.verifiedProviders ?? "—", icon: UserCheck, color: "bg-green-50 text-green-600 border-green-100", href: "/admin/providers" },
  ];

  const activityCards = [
    { label: "Réservations totales", value: stats?.totalBookings ?? "—", icon: Calendar, color: "bg-pink-50 text-pink-600 border-pink-100", href: "/admin/bookings" },
    { label: "Réservations en attente", value: stats?.pendingBookings ?? "—", icon: AlertCircle, color: "bg-orange-50 text-orange-600 border-orange-100", href: "/admin/bookings" },
    { label: "Conversations", value: stats?.totalConversations ?? "—", icon: MessageCircle, color: "bg-sky-50 text-sky-600 border-sky-100", href: "/admin/users" },
    { label: "Avis clients", value: stats?.totalReviews ?? "—", icon: Star, color: "bg-yellow-50 text-yellow-600 border-yellow-100", href: "/admin/reviews" },
  ];

  const formationCards = [
    { label: "Total formations", value: stats?.totalFormations ?? "—", icon: GraduationCap, color: "bg-indigo-50 text-indigo-600 border-indigo-100", href: "/admin/formations" },
    { label: "Achats formations", value: stats?.totalFormationPurchases ?? "—", icon: ShoppingCart, color: "bg-teal-50 text-teal-600 border-teal-100", href: "/admin/formations" },
    { label: "Revenus formations", value: stats?.totalRevenue != null ? `${stats.totalRevenue.toLocaleString()} F` : "—", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600 border-emerald-100", href: "/admin/formations" },
    { label: "Catégories actives", value: stats?.totalCategories ?? "—", icon: Tag, color: "bg-violet-50 text-violet-600 border-violet-100", href: "/admin/categories" },
  ];

  const renderCards = (cards: typeof mainCards, title: string) => (
    <div className="mb-8">
      <h2 className="font-heading font-semibold text-lg mb-4 text-gray-700">{title}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className={`rounded-xl p-5 border hover:shadow-lg transition-shadow ${card.color}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm mt-0.5 opacity-80">{card.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Dashboard Administration</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Alertes rapides */}
      {stats?.pendingProviders > 0 && (
        <Link href="/admin/providers" className="block bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">
                {stats.pendingProviders} prestataire{stats.pendingProviders > 1 ? "s" : ""} en attente de vérification
              </p>
              <p className="text-sm text-amber-600">Cliquez pour vérifier</p>
            </div>
          </div>
        </Link>
      )}

      {renderCards(mainCards, "Utilisateurs")}
      {renderCards(activityCards, "Activité")}
      {renderCards(formationCards, "Formations & Contenu")}
    </div>
  );
}
