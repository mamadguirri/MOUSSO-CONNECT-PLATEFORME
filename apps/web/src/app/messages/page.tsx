"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { MessageCircle, ChevronRight } from "lucide-react";

import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Skeleton } from "@/components/ui/skeleton";

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function lastMessagePreview(msg: any, userId: string) {
  if (!msg) return "Aucun message";
  const prefix = msg.senderId === userId ? "Vous : " : "";
  if (msg.type === "IMAGE") return `${prefix}📷 Photo`;
  if (msg.type === "VOICE") return `${prefix}🎤 Vocal`;
  if (msg.type === "FILE") return `${prefix}📎 ${msg.fileName || "Fichier"}`;
  return `${prefix}${msg.content?.slice(0, 50) || ""}`;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiGet<any[]>("/messages/conversations"),
    enabled: !!user,
    refetchInterval: 10000, // Refresh toutes les 10 secondes
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-heading font-bold text-2xl mb-4">Messages</h1>

        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="font-semibold text-lg text-gray-600 mb-1">Aucune conversation</h2>
            <p className="text-sm text-gray-400">
              Vos conversations avec les prestataires apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conv: any) => (
              <button
                key={conv.id}
                onClick={() => router.push(`/messages/${conv.id}`)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left rounded-lg"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-musso-pink-light flex items-center justify-center overflow-hidden">
                    {conv.otherAvatar ? (
                      <img src={conv.otherAvatar} alt={conv.otherUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-musso-pink font-bold text-lg">
                        {conv.otherUser.name[0]}
                      </span>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-musso-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-medium text-sm truncate ${conv.unreadCount > 0 ? "text-gray-900" : "text-gray-700"}`}>
                      {conv.otherUser.name}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : ""}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                    {lastMessagePreview(conv.lastMessage, user.id)}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
