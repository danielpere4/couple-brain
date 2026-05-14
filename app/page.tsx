"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { TrendingDown, TrendingUp, Wallet, Scale } from "lucide-react";
import { useUser, USERS } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";

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
  categoria: string;
  descripcion: string;
  usuario_id: number;
  fecha: string;
};

type Deuda = { id: string; monto: number };

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
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-[1.75rem] font-bold leading-tight mt-1 truncate" style={{ color: textColor }}>
            ${value}
          </p>
          <p className="text-xs mt-0.5" style={{ color: accent }}>{sub}</p>
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

export default function DashboardPage() {
  const { activeUser } = useUser();
  const [greeting, setGreeting] = useState("Hola");
  const [dateStr, setDateStr] = useState("");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);

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

  const totalGastos = movimientos.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
  const totalIngresos = movimientos.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
  const balance = totalIngresos - totalGastos;
  const totalDeudas = deudas.reduce((s, d) => s + d.monto, 0);

  const categoryData = Object.entries(
    movimientos
      .filter(m => m.tipo === "gasto")
      .reduce<Record<string, number>>((acc, m) => {
        const k = m.categoria || "Otro";
        acc[k] = (acc[k] ?? 0) + m.monto;
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value }));

  const recent = movimientos.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {greeting}, {activeUser?.name} 👋
        </h1>
        <p className="text-gray-400 mt-1 text-sm">{dateStr}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Gastos del mes"
          value={fmt(totalGastos)}
          sub={`${movimientos.filter(m => m.tipo === "gasto").length} registros`}
          bg="bg-amber-50" textColor="#92400E" accent="#F59E0B" Icon={TrendingDown}
        />
        <SummaryCard
          title="Ingresos del mes"
          value={fmt(totalIngresos)}
          sub={`${movimientos.filter(m => m.tipo === "ingreso").length} registros`}
          bg="bg-emerald-50" textColor="#065F46" accent="#10B981" Icon={TrendingUp}
        />
        <SummaryCard
          title="Balance"
          value={fmt(balance)}
          sub={balance >= 0 ? "Positivo ↑" : "En negativo ↓"}
          bg="bg-sky-50" textColor="#0C4A6E" accent="#0EA5E9" Icon={Wallet}
        />
        <SummaryCard
          title="Deudas activas"
          value={fmt(totalDeudas)}
          sub={`${deudas.length} pendiente${deudas.length !== 1 ? "s" : ""}`}
          bg="bg-violet-50" textColor="#3B0764" accent="#7C3AED" Icon={Scale}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Últimos movimientos
            </h2>
            <Link href="/finanzas" className="text-xs text-indigo-500 hover:underline">
              Ver todos
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm font-medium">Sin movimientos este mes</p>
              <p className="text-xs mt-1 text-gray-300">Ve a Finanzas para registrar uno</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recent.map(m => {
                const user = USERS.find(u => u.id === m.usuario_id);
                return (
                  <li key={m.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: m.tipo === "gasto" ? "#FEF3C7" : "#D1FAE5" }}
                    >
                      {m.tipo === "gasto"
                        ? <TrendingDown className="w-4 h-4 text-amber-500" />
                        : <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {m.descripcion || m.categoria || "Sin descripción"}
                      </p>
                      <p className="text-xs text-gray-400">{m.categoria}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold ${m.tipo === "gasto" ? "text-amber-600" : "text-emerald-600"}`}>
                        {m.tipo === "gasto" ? "−" : "+"}${fmt(m.monto)}
                      </p>
                      {user && (
                        <span className="text-[10px] font-medium" style={{ color: user.color }}>
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

        <div className="lg:col-span-2 bg-white rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-5 uppercase tracking-wide">
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
