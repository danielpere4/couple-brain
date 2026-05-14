"use client";

import { useState, useEffect } from "react";
import { TrendingDown, TrendingUp, Wallet, Scale } from "lucide-react";
import { useUser } from "@/context/UserContext";

// ─── Utils ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("es-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Summary card ─────────────────────────────────────────────────────────────

type CardProps = {
  title: string;
  value: string;
  sub: string;
  bg: string;
  textColor: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
};

function SummaryCard({ title, value, sub, bg, textColor, accent, Icon }: CardProps) {
  return (
    <div className={`${bg} rounded-2xl p-5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p
            className="text-[1.75rem] font-bold leading-tight mt-1 truncate"
            style={{ color: textColor }}
          >
            ${value}
          </p>
          <p className="text-xs mt-0.5" style={{ color: accent }}>
            {sub}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accent + "22" }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { activeUser } = useUser();
  const [greeting, setGreeting] = useState("Hola");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    const g =
      h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
    const d = new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setGreeting(g);
    setDateStr(d.charAt(0).toUpperCase() + d.slice(1));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {greeting}, {activeUser?.name} 👋
        </h1>
        <p className="text-gray-400 mt-1 text-sm">{dateStr}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Gastos del mes"
          value={fmt(0)}
          sub="Sin datos aún"
          bg="bg-amber-50"
          textColor="#92400E"
          accent="#F59E0B"
          Icon={TrendingDown}
        />
        <SummaryCard
          title="Ingresos del mes"
          value={fmt(0)}
          sub="Sin datos aún"
          bg="bg-emerald-50"
          textColor="#065F46"
          accent="#10B981"
          Icon={TrendingUp}
        />
        <SummaryCard
          title="Balance"
          value={fmt(0)}
          sub="—"
          bg="bg-sky-50"
          textColor="#0C4A6E"
          accent="#0EA5E9"
          Icon={Wallet}
        />
        <SummaryCard
          title="Deudas activas"
          value={fmt(0)}
          sub="Sin deudas pendientes"
          bg="bg-violet-50"
          textColor="#3B0764"
          accent="#7C3AED"
          Icon={Scale}
        />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent movements */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-5 uppercase tracking-wide">
            Últimos movimientos
          </h2>
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-sm font-medium">Sin movimientos aún</p>
            <p className="text-xs mt-1 text-gray-300">
              Ve a Finanzas para registrar uno
            </p>
          </div>
        </div>

        {/* Category placeholder */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-5 uppercase tracking-wide">
            Gastos por categoría
          </h2>
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm font-medium">Sin gastos este mes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
