"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, USERS } from "@/context/UserContext";
import {
  Brain,
  LayoutDashboard,
  Wallet,
  Scale,
  StickyNote,
  Settings,
  LogOut,
  ArrowLeftRight,
} from "lucide-react";

const generalItems = [
  { href: "/", label: "Inicio", Icon: LayoutDashboard },
  { href: "/finanzas", label: "Finanzas", Icon: Wallet },
  { href: "/deudas", label: "Deudas", Icon: Scale },
  { href: "/notas", label: "Notas", Icon: StickyNote },
];

type Props = { onLinkClick?: () => void };

export function SidebarContent({ onLinkClick }: Props) {
  const pathname = usePathname();
  const { activeUser, setActiveUser, clearUser } = useUser();
  const otherUser = USERS.find((u) => u.id !== activeUser?.id)!;

  return (
    <div className="flex flex-col h-full" style={{ background: "#16162A" }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 flex-shrink-0">
        <Brain className="w-5 h-5 text-violet-400 flex-shrink-0" />
        <span className="font-bold text-white text-lg tracking-tight">CoupleBrain</span>
        <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0 ml-0.5" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* General section */}
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "#4B5563" }}>
          General
        </p>
        <div className="space-y-0.5 mb-6">
          {generalItems.map(({ href, label, Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? `${activeUser?.color}20` : "transparent",
                  color: isActive ? "#fff" : "#6B7280",
                  borderLeft: isActive ? `3px solid ${activeUser?.color}` : "3px solid transparent",
                  paddingLeft: isActive ? "9px" : "12px",
                }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? activeUser?.color : undefined }}
                />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Herramientas section */}
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "#4B5563" }}>
          Herramientas
        </p>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveUser(otherUser)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
            style={{ color: "#6B7280" }}
          >
            <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
            Cambiar a {otherUser?.name}
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
            style={{ color: "#6B7280" }}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            Configuración
          </button>
        </div>
      </nav>

      {/* User section */}
      <div className="px-4 pb-5 pt-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: activeUser?.color }}
          >
            {activeUser?.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{activeUser?.name}</p>
            <p className="text-xs" style={{ color: "#4B5563" }}>Usuario activo</p>
          </div>
          <button
            onClick={clearUser}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: "#EF4444", opacity: 0.6 }}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-[240px] flex-shrink-0 h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}
