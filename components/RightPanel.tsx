"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { USERS } from "@/context/UserContext";

type Deuda = {
  id: string;
  descripcion: string;
  monto: number;
  usuario_id: number;
};

function fmt(n: number) {
  return n.toLocaleString("es-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function MiniCalendar() {
  const today = new Date();
  const [current, setCurrent] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = current.getFullYear();
  const month = current.getMonth();

  const monthName = current
    .toLocaleDateString("es-ES", { month: "long" })
    .replace(/^\w/, c => c.toUpperCase());

  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirst = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < adjustedFirst; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-base font-bold text-gray-900">{monthName}</span>
          <span className="text-base font-bold text-gray-400 ml-1.5">{year}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrent(new Date(year, month - 1, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setCurrent(new Date(year, month + 1, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-300 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          const isToday =
            d === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          return (
            <div key={i} className="flex items-center justify-center h-8">
              {d && (
                <span
                  className={`text-xs w-7 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer font-medium ${
                    isToday ? "text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
                  }`}
                  style={isToday ? { backgroundColor: "#7C3AED" } : {}}
                >
                  {d}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Today label */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-800">
            {today.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Hoy</p>
        </div>
        <Link
          href="/deudas"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "#111827" }}
        >
          <Plus className="w-3 h-3" />
          Agregar
        </Link>
      </div>
    </div>
  );
}

export default function RightPanel() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);

  useEffect(() => {
    supabase
      .from("deudas")
      .select("id, descripcion, monto, usuario_id")
      .eq("pagada", false)
      .limit(6)
      .then(({ data }) => setDeudas(data ?? []));
  }, []);

  return (
    <aside
      className="w-[280px] flex-shrink-0 h-screen sticky top-0 flex flex-col overflow-y-auto"
      style={{ background: "#F7F7F2", borderLeft: "1px solid #E5E5E0" }}
    >
      {/* Calendar section */}
      <div className="p-6">
        <MiniCalendar />
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-gray-100" />

      {/* Deudas pendientes */}
      <div className="p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Deudas pendientes</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Este mes</p>
          </div>
          {deudas.length > 0 && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#EDE9FE", color: "#6D28D9" }}
            >
              {deudas.length}
            </span>
          )}
        </div>

        {deudas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "#F0FDF4" }}
            >
              <span className="text-xl">✓</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Todo al día</p>
            <p className="text-xs text-gray-400 mt-1">Sin deudas pendientes</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {deudas.map((d) => {
              const user = USERS.find((u) => u.id === d.usuario_id);
              return (
                <li
                  key={d.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white"
                  style={{ border: "1px solid #F3F4F6" }}
                >
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ background: user?.color ?? "#9CA3AF" }}
                  />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: user?.color ?? "#9CA3AF" }}
                  >
                    {user?.name[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {d.descripcion || "Sin descripción"}
                    </p>
                    <p className="text-[11px] font-bold mt-0.5" style={{ color: user?.color ?? "#9CA3AF" }}>
                      ${fmt(d.monto)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {deudas.length > 0 && (
          <Link
            href="/deudas"
            className="block text-center text-xs font-semibold mt-4 py-2.5 rounded-xl transition-colors hover:opacity-80"
            style={{ background: "#F5F3FF", color: "#6D28D9" }}
          >
            Ver todas →
          </Link>
        )}
      </div>
    </aside>
  );
}
