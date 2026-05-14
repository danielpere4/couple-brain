"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useUser } from "@/context/UserContext";
import UserSelector from "@/components/UserSelector";
import Sidebar, { SidebarContent } from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { activeUser, isLoading } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) return <div className="min-h-screen bg-[#F7F7F2]" />;
  if (!activeUser) return <UserSelector />;

  return (
    <div className="flex min-h-screen bg-[#F7F7F2]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer + overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-200 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 bottom-0 w-[240px] shadow-xl transition-transform duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent onLinkClick={() => setMobileOpen(false)} />
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-100 sticky top-0 z-40">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors -ml-1"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900">CoupleBrain</span>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeUser.color }}
            />
            <span className="text-sm text-gray-600">{activeUser.name}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-5xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
