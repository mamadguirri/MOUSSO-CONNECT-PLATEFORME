"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Users, UserCheck, Clock, Calendar, Tag, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiGet<any>("/admin/stats"),
  });

  const cards = [
    { label: "Total utilisateurs", value: stats?.totalUsers ?? "—", icon: Users, color: "bg-blue-50 text-blue-600", href: "/admin/users" },
    { label: "Total prestataires", value: stats?.totalProviders ?? "—", icon: UserCheck, color: "bg-purple-50 text-purple-600", href: "/admin/providers" },
    { label: "En attente", value: stats?.pendingProviders ?? "—", icon: Clock, color: "bg-amber-50 text-amber-600", href: "/admin/providers" },
    { label: "Vérifiés", value: stats?.verifiedProviders ?? "—", icon: UserCheck, color: "bg-green-50 text-green-600", href: "/admin/providers" },
    { label: "Catégories", value: stats?.totalCategories ?? "—", icon: Tag, color: "bg-indigo-50 text-indigo-600", href: "/admin/categories" },
    { label: "Réservations", value: stats?.totalBookings ?? "—", icon: Calendar, color: "bg-pink-50 text-pink-600", href: "/admin/bookings" },
    { label: "Réservations en attente", value: stats?.pendingBookings ?? "—", icon: AlertCircle, color: "bg-orange-50 text-orange-600", href: "/admin/bookings" },
  ];

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="bg-white rounded-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
