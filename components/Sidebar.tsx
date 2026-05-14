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
} from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", Icon: LayoutDashboard },
  { href: "/finanzas", label: "Finanzas", Icon: Wallet },
  { href: "/deudas", label: "Deudas", Icon: Scale },
  { href: "/notas", label: "Notas", Icon: StickyNote },
];

type Props = { onLinkClick?: () => void };

export function SidebarContent({ onLinkClick }: Props) {
  const pathname = usePathname();
  const { activeUser, setActiveUser } = useUser();
  const otherUser = USERS.find((u) => u.id !== activeUser?.id)!;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 flex-shrink-0">
        <Brain className="w-6 h-6 text-purple-600 flex-shrink-0" />
        <span className="font-bold text-gray-900 text-lg">CoupleBrain</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive
                  ? `${activeUser?.color}18`
                  : "transparent",
                color: isActive ? activeUser?.color : "#4B5563",
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-4 pb-5 pt-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: activeUser?.color }}
          >
            {activeUser?.name[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {activeUser?.name}
            </p>
            <p className="text-xs text-gray-400">Usuario activo</p>
          </div>
        </div>
        <button
          onClick={() => setActiveUser(otherUser)}
          className="w-full text-xs text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition-colors"
        >
          Cambiar a {otherUser?.name}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-[240px] flex-shrink-0 h-screen sticky top-0 border-r border-gray-100">
      <SidebarContent />
    </aside>
  );
}
