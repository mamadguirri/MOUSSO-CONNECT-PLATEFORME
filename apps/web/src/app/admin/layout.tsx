"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, Users, LogOut, Tag, Calendar, UserCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Chargement...</div>;
  }

  if (!user || user.role !== "ADMIN") {
    router.push("/auth/login");
    return null;
  }

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/providers", label: "Prestataires", icon: UserCheck },
    { href: "/admin/users", label: "Utilisateurs", icon: Users },
    { href: "/admin/categories", label: "Catégories", icon: Tag },
    { href: "/admin/bookings", label: "Réservations", icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-musso-dark text-white flex flex-col">
        <div className="p-6">
          <h1 className="font-heading font-bold text-lg text-musso-pink">Musso Admin</h1>
        </div>
        <nav className="flex-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                  active ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 w-full"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
    </div>
  );
}
