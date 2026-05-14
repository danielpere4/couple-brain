"use client";

import { useUser, USERS } from "@/context/UserContext";

export default function TopBar() {
  const { activeUser, setActiveUser, clearUser } = useUser();

  if (!activeUser) return null;

  const otherUser = USERS.find((u) => u.id !== activeUser.id)!;

  return (
    <header className="flex items-center justify-between px-4 h-13 border-b border-[#2A2A2A] bg-[#0F0F0F] sticky top-0 z-40">
      <span className="text-sm font-bold tracking-tight text-[#F5F5F5]">
        couple-brain
      </span>

      <div className="flex items-center gap-3">
        {/* Active user badge */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: activeUser.color }}
          />
          <span className="text-sm font-medium">{activeUser.name}</span>
        </div>

        {/* Switch to other user */}
        <button
          onClick={() => setActiveUser(otherUser)}
          className="text-xs text-[#6B7280] border border-[#2A2A2A] rounded-full px-2.5 py-1 active:opacity-70 transition-opacity"
        >
          {otherUser.name}
        </button>
      </div>
    </header>
  );
}
