"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, Calendar, CheckCircle, XCircle, GraduationCap, Star,
  ShieldCheck, ShieldAlert, Info, CheckCheck, ArrowLeft,
} from "lucide-react";

import { apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  BOOKING_NEW: { icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
  BOOKING_ACCEPTED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  BOOKING_REJECTED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  BOOKING_COMPLETED: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
  BOOKING_CANCELLED: { icon: XCircle, color: "text-gray-600", bg: "bg-gray-50" },
  FORMATION_PURCHASE: { icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
  REVIEW_NEW: { icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
  PROVIDER_VERIFIED: { icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50" },
  PROVIDER_SUSPENDED: { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
  SYSTEM: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getNotificationLink(notif: any): string | null {
  const data = notif.data as any;
  switch (notif.type) {
    case "BOOKING_NEW":
    case "BOOKING_ACCEPTED":
    case "BOOKING_REJECTED":
    case "BOOKING_COMPLETED":
    case "BOOKING_CANCELLED":
      return "/bookings";
    case "FORMATION_PURCHASE":
      return data?.formationId ? `/formations/${data.formationId}` : "/formations";
    case "REVIEW_NEW":
      return data?.providerId ? `/providers/${data.providerId}` : "/dashboard";
    case "PROVIDER_VERIFIED":
    case "PROVIDER_SUSPENDED":
      return "/dashboard";
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet<any>("/notifications?limit=50"),
    enabled: !!user,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiPatch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  useEffect(() => {
    if (!user) router.push("/auth/login");
  }, [user, router]);

  if (!user) return null;

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
              <Bell className="w-6 h-6 text-musso-pink" />
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="bg-musso-pink text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1.5 text-sm text-musso-pink hover:underline font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              Tout lire
            </button>
          )}
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune notification</p>
            <p className="text-gray-400 text-sm mt-1">Vos notifications apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif: any) => {
              const config = typeConfig[notif.type] || typeConfig.SYSTEM;
              const Icon = config.icon;
              const link = getNotificationLink(notif);

              const content = (
                <div
                  className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
                    notif.isRead
                      ? "bg-white border border-gray-100"
                      : "bg-musso-pink/5 border border-musso-pink/20 shadow-sm"
                  } ${link ? "hover:shadow-md cursor-pointer" : ""}`}
                  onClick={() => {
                    if (!notif.isRead) markReadMutation.mutate(notif.id);
                    if (link) router.push(link);
                  }}
                >
                  <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${notif.isRead ? "text-gray-700" : "text-gray-900 font-semibold"}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <div className="w-2.5 h-2.5 rounded-full bg-musso-pink flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              );

              return <div key={notif.id}>{content}</div>;
            })}
          </div>
        )}
      </div>
    </>
  );
}
