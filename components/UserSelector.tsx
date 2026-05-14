"use client";

import { Brain } from "lucide-react";
import { USERS, useUser } from "@/context/UserContext";

export default function UserSelector() {
  const { setActiveUser } = useUser();

  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-1">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            CoupleBrain
          </h1>
          <p className="text-gray-400">¿Quién eres?</p>
        </div>

        <div className="space-y-4">
          {USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => setActiveUser(user)}
              className="w-full py-5 rounded-2xl text-white text-xl font-semibold transition-all active:scale-95 shadow-sm"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
