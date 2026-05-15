"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { TrendingDown, TrendingUp, Wallet, Scale, Search } from "lucide-react";
import { useUser, USERS } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import { useTasas } from "@/context/TasasContext";

const CategoryPieChart = dynamic(
  () => import("@/components/charts/CategoryPieChart"),
  { ssr: false }
);

function fmt(n: number) {
  return n.toLocaleString("es-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Movimiento = {
  id: string;
  tipo: "gasto" | "ingreso";
  monto: number;
  moneda: string;
  categoria: string;
  descripcion: string;
  usuario_id: number;
  fecha: string;
};

type Deuda = { id: string; monto: number };

// Decorative SVG leaf for cards
function LeafDecor({ color }: { color: string }) {
  return (
    <svg
      className="absolute bottom-0 right-0 pointer-events-none"
      width="110"
      height="110"
      viewBox="0 0 110 110"
      fill="none"
    >
      <ellipse cx="85" cy="85" rx="55" ry="30" fill={color} opacity="0.18" transform="rotate(-40 85 85)" />
      <ellipse cx="85" cy="85" rx="55" ry="30" fill={color} opacity="0.12" transform="rotate(10 85 85)" />
      <ellipse cx="85" cy="85" rx="30" ry="15" fill={color} opacity="0.10" transform="rotate(-15 85 85)" />
    </svg>
  );
}

type CardProps = {
  title: string;
  value: string;
  sub: string;
  bg: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  href: string;
  stats: { label: string; value: string }[];
};

function SummaryCard({ title, value, sub, bg, accent, Icon, href, stats }: CardProps) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden flex flex-col gap-3" style={{ background: bg, minHeight: 170 }}>
      <LeafDecor color={accent} />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}25` }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
          <p className="text-sm font-semibold text-gray-700">{title}</p>
        </div>
        <Link href={href} className="text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: accent }}>
          Ver →
        </Link>
      </div>

      <div className="relative z-10">
        <p className="text-3xl font-extrabold text-gray-900 leading-tight">${value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>

      <div className="relative z-10 flex gap-5 mt-auto pt-2" style={{ borderTop: `1px solid ${accent}20` }}>
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-sm font-bold text-gray-800">{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const FILTER_TABS = [
  { key: "todos", label: "Todos" },
  { key: "gastos", label: "Gastos" },
  { key: "ingresos", label: "Ingresos" },
];

export default function DashboardPage() {
  const { activeUser } = useUser();
  const { toUSD } = useTasas();
  const [greeting, setGreeting] = useState("Hola");
  const [dateStr, setDateStr] = useState("");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");

  useEffect(() => {
    const h = new Date().getHours();
    const g = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
    const d = new Date().toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    setGreeting(g);
    setDateStr(d.charAt(0).toUpperCase() + d.slice(1));
  }, []);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [{ data: movs }, { data: deudasData }] = await Promise.all([
        supabase
          .from("movimientos")
          .select("*")
          .gte("fecha", monthStart)
          .lte("fecha", monthEnd)
          .order("fecha", { ascending: false }),
        supabase.from("deudas").select("id, monto").eq("pagada", false),
      ]);

      setMovimientos(movs ?? []);
      setDeudas(deudasData ?? []);
    }
    load();
  }, []);

  const gastos = movimientos.filter(m => m.tipo === "gasto");
  const ingresos = movimientos.filter(m => m.tipo === "ingreso");
  const totalGastos = gastos.reduce((s, m) => s + toUSD(m.monto, m.moneda), 0);
  const totalIngresos = ingresos.reduce((s, m) => s + toUSD(m.monto, m.moneda), 0);
  const balance = totalIngresos - totalGastos;
  const totalDeudas = deudas.reduce((s, d) => s + d.monto, 0);

  const avgGasto = gastos.length > 0 ? totalGastos / gastos.length : 0;
  const avgIngreso = ingresos.length > 0 ? totalIngresos / ingresos.length : 0;

  const categoryData = Object.entries(
    gastos.reduce<Record<string, number>>((acc, m) => {
      const k = m.categoria || "Otro";
      acc[k] = (acc[k] ?? 0) + toUSD(m.monto, m.moneda);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const topCategoria = categoryData.sort((a, b) => b.value - a.value)[0];

  const filtered = (() => {
    let base = movimientos;
    if (activeFilter === "gastos") base = gastos;
    if (activeFilter === "ingresos") base = ingresos;
    if (search.trim()) {
      base = base.filter(m =>
        m.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
        m.categoria?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return base.slice(0, 6);
  })();

  return (
    <div className="space-y-6">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar movimientos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-700 placeholder-gray-400 border border-gray-100 shadow-sm focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": `${activeUser?.color}40` } as React.CSSProperties}
          />
        </div>
        <div className="flex gap-2">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: activeFilter === tab.key ? activeUser?.color : "#fff",
                color: activeFilter === tab.key ? "#fff" : "#6B7280",
                boxShadow: activeFilter === tab.key ? `0 2px 8px ${activeUser?.color}40` : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {greeting}, {activeUser?.name} 👋
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          {dateStr} &nbsp;·&nbsp; {movimientos.length} movimiento{movimientos.length !== 1 ? "s" : ""} este mes
        </p>
      </div>

      {/* Summary cards — 2×2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          title="Gastos del mes"
          value={fmt(totalGastos)}
          sub={`${gastos.length} registros este mes`}
          bg="#FFFBEB"
          accent="#F59E0B"
          Icon={TrendingDown}
          href="/finanzas"
          stats={[
            { label: "Promedio", value: `$${fmt(avgGasto)}` },
            { label: "Registros", value: String(gastos.length) },
            { label: "Top categoría", value: topCategoria?.name ?? "—" },
          ]}
        />
        <SummaryCard
          title="Ingresos del mes"
          value={fmt(totalIngresos)}
          sub={`${ingresos.length} registros este mes`}
          bg="#FDF2F8"
          accent="#EC4899"
          Icon={TrendingUp}
          href="/finanzas"
          stats={[
            { label: "Promedio", value: `$${fmt(avgIngreso)}` },
            { label: "Registros", value: String(ingresos.length) },
            { label: "Estado", value: totalIngresos > 0 ? "Activo" : "Sin datos" },
          ]}
        />
        <SummaryCard
          title="Balance"
          value={fmt(Math.abs(balance))}
          sub={balance >= 0 ? "Saldo positivo este mes" : "Saldo negativo este mes"}
          bg="#EEF2FF"
          accent="#6366F1"
          Icon={Wallet}
          href="/finanzas"
          stats={[
            { label: "Ingresos", value: `$${fmt(totalIngresos)}` },
            { label: "Gastos", value: `$${fmt(totalGastos)}` },
            { label: "Tendencia", value: balance >= 0 ? "↑ Positiva" : "↓ Negativa" },
          ]}
        />
        <SummaryCard
          title="Deudas activas"
          value={fmt(totalDeudas)}
          sub={`${deudas.length} pendiente${deudas.length !== 1 ? "s" : ""}`}
          bg="#F0FDF4"
          accent="#10B981"
          Icon={Scale}
          href="/deudas"
          stats={[
            { label: "Pendientes", value: String(deudas.length) },
            { label: "Promedio", value: deudas.length > 0 ? `$${fmt(totalDeudas / deudas.length)}` : "—" },
            { label: "Estado", value: deudas.length === 0 ? "Al día ✓" : "Con deudas" },
          ]}
        />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Movimientos list */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800">
              Últimos movimientos
            </h2>
            <Link href="/finanzas" className="text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: activeUser?.color }}>
              Ver todos →
            </Link>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm font-medium">
                {search ? "Sin resultados" : "Sin movimientos este mes"}
              </p>
              {!search && (
                <p className="text-xs mt-1 text-gray-300">Ve a Finanzas para registrar uno</p>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map(m => {
                const user = USERS.find(u => u.id === m.usuario_id);
                return (
                  <li key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: m.tipo === "gasto" ? "#FEF3C7" : "#D1FAE5" }}
                    >
                      {m.tipo === "gasto"
                        ? <TrendingDown className="w-4 h-4 text-amber-500" />
                        : <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {m.descripcion || m.categoria || "Sin descripción"}
                      </p>
                      <p className="text-xs text-gray-400">{m.categoria}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${m.tipo === "gasto" ? "text-amber-600" : "text-emerald-600"}`}>
                        {m.tipo === "gasto" ? "−" : "+"}${fmt(m.monto)}
                      </p>
                      {user && (
                        <span className="text-[10px] font-semibold" style={{ color: user.color }}>
                          {user.name}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Gastos por categoría */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-5">
            Gastos por categoría
          </h2>
          {categoryData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-3">📊</p>
              <p className="text-sm font-medium">Sin gastos este mes</p>
            </div>
          ) : (
            <CategoryPieChart data={categoryData} />
          )}
        </div>
      </div>
    </div>
  );
}
