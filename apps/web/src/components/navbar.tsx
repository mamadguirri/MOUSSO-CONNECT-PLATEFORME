"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api";
import { Menu, X, LogOut, MessageCircle } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => apiGet<{ unreadCount: number }>("/messages/unread-count"),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const unreadCount = unreadData?.unreadCount || 0;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-heading font-bold text-xl text-musso-pink">
          Musso Connect
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/search" className="text-sm hover:text-musso-pink transition-colors">
            Rechercher
          </Link>
          {user ? (
            <>
              <Link href="/messages" className="text-sm hover:text-musso-pink transition-colors relative flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-3 w-4 h-4 bg-musso-pink text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/bookings" className="text-sm hover:text-musso-pink transition-colors">
                Réservations
              </Link>
              {user.role === "PROVIDER" && (
                <Link href="/dashboard" className="text-sm hover:text-musso-pink transition-colors">
                  Tableau de bord
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin" className="text-sm hover:text-musso-pink transition-colors">
                  Administration
                </Link>
              )}
              <button
                onClick={() => logout()}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="bg-musso-pink text-white text-sm font-semibold px-5 h-10 rounded-btn flex items-center hover:brightness-110 transition-all"
            >
              Connexion
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <Link href="/messages" className="relative p-2">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-musso-pink text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link href="/search" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>
            Rechercher
          </Link>
          {user ? (
            <>
              <Link href="/messages" className="flex items-center gap-2 text-sm py-2" onClick={() => setMenuOpen(false)}>
                <MessageCircle className="w-4 h-4" />
                Messages
                {unreadCount > 0 && (
                  <span className="w-5 h-5 bg-musso-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/bookings" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>
                Réservations
              </Link>
              {user.role === "PROVIDER" && (
                <Link href="/dashboard" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>
                  Tableau de bord
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin" className="block text-sm py-2" onClick={() => setMenuOpen(false)}>
                  Administration
                </Link>
              )}
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="block text-sm py-2 text-red-500"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="block text-center bg-musso-pink text-white text-sm font-semibold px-5 py-3 rounded-btn"
              onClick={() => setMenuOpen(false)}
            >
              Connexion
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
