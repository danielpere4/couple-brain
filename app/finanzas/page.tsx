"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, TrendingDown, TrendingUp, X, Wallet, Pencil, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser, USERS } from "@/context/UserContext";
import { useTasas } from "@/context/TasasContext";

const CategoryPieChart = dynamic(
  () => import("@/components/charts/CategoryPieChart"),
  { ssr: false }
);

type Movimiento = {
  id: string;
  tipo: "gasto" | "ingreso";
  monto: number;
  moneda: string;
  cuenta: string;
  categoria: string;
  descripcion: string;
  usuario_id: number;
  fecha: string;
};

const CATEGORIAS_GASTO = [
  "Alimentación", "Transporte", "Vivienda", "Salud",
  "Entretenimiento", "Ropa", "Servicios", "Educación",
  "Carro", "Koras", "Otro",
];
const CATEGORIAS_INGRESO = ["Sueldo", "Freelance", "Regalo", "Inversión", "Koras", "Otro"];

const CUENTAS = [
  { key: "Binance",        color: "#F3BA2F", label: "BN", bg: "#FFFBEB", moneda: "USD", simbolo: "$"    },
  { key: "Zelle",          color: "#6B3FA0", label: "ZL", bg: "#F5F3FF", moneda: "USD", simbolo: "$"    },
  { key: "PayPal",         color: "#0070BA", label: "PP", bg: "#EFF6FF", moneda: "USD", simbolo: "$"    },
  { key: "Bolívares",      color: "#CE1126", label: "Bs", bg: "#FFF1F2", moneda: "VES", simbolo: "Bs."  },
  { key: "Bancolombia",    color: "#003F87", label: "BC", bg: "#EFF6FF", moneda: "COP", simbolo: "COP$" },
  { key: "Efectivo USD",   color: "#16A34A", label: "$", bg:  "#F0FDF4", moneda: "USD", simbolo: "$"    },
  { key: "Efectivo COP",   color: "#B45309", label: "$", bg:  "#FFFBEB", moneda: "COP", simbolo: "COP$" },
] as const;


function fmt(n: number) {
  return n.toLocaleString("es-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMonto(monto: number, cuentaKey: string): string {
  const c = CUENTAS.find(x => x.key === cuentaKey);
  if (!c) return `$${fmt(monto)}`;
  if (c.moneda === "VES") return `Bs. ${monto.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (c.moneda === "COP") return `COP $${Math.round(monto).toLocaleString("es-CO")}`;
  return `$${fmt(monto)}`;
}

// Mismo decorador SVG que el dashboard
function LeafDecor({ color }: { color: string }) {
  return (
    <svg className="absolute bottom-0 right-0 pointer-events-none" width="100" height="100" viewBox="0 0 110 110" fill="none">
      <ellipse cx="85" cy="85" rx="55" ry="30" fill={color} opacity="0.18" transform="rotate(-40 85 85)" />
      <ellipse cx="85" cy="85" rx="55" ry="30" fill={color} opacity="0.12" transform="rotate(10 85 85)" />
      <ellipse cx="85" cy="85" rx="30" ry="15" fill={color} opacity="0.10" transform="rotate(-15 85 85)" />
    </svg>
  );
}

function CuentaBadge({ cuentaKey }: { cuentaKey: string }) {
  const c = CUENTAS.find(x => x.key === cuentaKey);
  if (!c) return <span className="text-xs text-gray-300">—</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white whitespace-nowrap" style={{ backgroundColor: c.color }}>
      {c.key}
      <span className="opacity-75 font-normal">· {c.moneda}</span>
    </span>
  );
}

export default function FinanzasPage() {
  const { activeUser } = useUser();
  const { toUSD, VES, COP, lastUpdate, setTasa } = useTasas();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO[0]);
  const [descripcion, setDescripcion] = useState("");
  const [cuenta, setCuenta] = useState<string>(CUENTAS[0].key);
  const [saving, setSaving] = useState(false);

  const [editingTasas, setEditingTasas] = useState(false);
  const [editVES, setEditVES] = useState("");
  const [editCOP, setEditCOP] = useState("");

  async function fetchMovimientos() {
    setLoading(true);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    try {
      const { data } = await supabase
        .from("movimientos").select("*")
        .gte("fecha", monthStart).lte("fecha", monthEnd)
        .order("fecha", { ascending: false });
      setMovimientos(data ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchMovimientos(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0) return;
    setSaving(true);
    const cuentaInfo = CUENTAS.find(c => c.key === cuenta);
    const { error } = await supabase.from("movimientos").insert({
      tipo,
      monto: parseFloat(monto),
      moneda: cuentaInfo?.moneda ?? "USD",
      cuenta,
      categoria,
      descripcion,
      usuario_id: activeUser?.id,
      fecha: new Date().toISOString(),
    });
    if (error) {
      console.error("Supabase error:", error);
      alert(`Error Supabase: ${error.message}`);
    } else {
      setMonto(""); setDescripcion(""); setShowForm(false);
      fetchMovimientos();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("movimientos").delete().eq("id", id);
    setMovimientos(ms => ms.filter(m => m.id !== id));
  }

  function openForm() {
    setTipo("gasto"); setCategoria(CATEGORIAS_GASTO[0]);
    setCuenta(CUENTAS[0].key); setMonto(""); setDescripcion("");
    setShowForm(true);
  }

  const gastos = movimientos.filter(m => m.tipo === "gasto");
  const ingresos = movimientos.filter(m => m.tipo === "ingreso");
  const totalGastos = gastos.reduce((s, m) => s + toUSD(m.monto, m.moneda), 0);
  const totalIngresos = ingresos.reduce((s, m) => s + toUSD(m.monto, m.moneda), 0);
  const balance = totalIngresos - totalGastos;

  const categoryData = Object.entries(
    gastos.reduce<Record<string, number>>((acc, m) => {
      const k = m.categoria || "Otro"; acc[k] = (acc[k] ?? 0) + toUSD(m.monto, m.moneda); return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const accountStats = CUENTAS.map(c => {
    const movs = movimientos.filter(m => (m.cuenta || m.moneda) === c.key);
    const ing = movs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
    const gas = movs.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
    return { ...c, ingresos: ing, gastos: gas, neto: ing - gas, count: movs.length };
  });

  const monthName = (() => {
    const s = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  return (
    <div className="space-y-6">
      {/* Header — mismo estilo que dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {monthName} · {movimientos.length} movimiento{movimientos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: activeUser?.color ?? "#7C3AED" }}
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {/* Barra de tasas */}
      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-3">
        {editingTasas ? (
          <>
            <span className="text-xs font-semibold text-gray-500">1 USD =</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Bs.</span>
              <input
                type="number" value={editVES} onChange={e => setEditVES(e.target.value)}
                className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-300"
                placeholder={String(VES)}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">COP $</span>
              <input
                type="number" value={editCOP} onChange={e => setEditCOP(e.target.value)}
                className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-300"
                placeholder={String(COP)}
              />
            </div>
            <button
              onClick={() => {
                if (editVES && parseFloat(editVES) > 0) setTasa("VES", parseFloat(editVES));
                if (editCOP && parseFloat(editCOP) > 0) setTasa("COP", parseFloat(editCOP));
                setEditingTasas(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: activeUser?.color ?? "#7C3AED" }}
            >
              <Check className="w-3 h-3" /> Guardar
            </button>
            <button onClick={() => setEditingTasas(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-400">1 USD =</span>
            <span className="text-xs font-bold text-gray-700">Bs. {VES > 0 ? VES.toLocaleString() : "—"}</span>
            <span className="text-gray-200">·</span>
            <span className="text-xs font-bold text-gray-700">COP ${COP > 0 ? COP.toLocaleString() : "—"}</span>
            {lastUpdate && (
              <>
                <span className="text-gray-200">·</span>
                <span className="text-[11px] text-gray-400">{lastUpdate}</span>
              </>
            )}
            <button
              onClick={() => { setEditVES(String(VES)); setEditCOP(String(COP)); setEditingTasas(true); }}
              className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Pencil className="w-3 h-3" /> Editar tasas
            </button>
          </>
        )}
      </div>

      {/* Cards de resumen — mismo estilo que el dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Ingresos */}
        <div className="rounded-2xl p-5 relative overflow-hidden flex flex-col gap-3" style={{ background: "#FDF2F8", minHeight: 140 }}>
          <LeafDecor color="#EC4899" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EC489925" }}>
                <TrendingUp className="w-4 h-4" style={{ color: "#EC4899" }} />
              </div>
              <p className="text-sm font-semibold text-gray-700">Ingresos del mes</p>
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-extrabold text-gray-900 leading-tight">+${fmt(totalIngresos)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{ingresos.length} registro{ingresos.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Gastos */}
        <div className="rounded-2xl p-5 relative overflow-hidden flex flex-col gap-3" style={{ background: "#FFFBEB", minHeight: 140 }}>
          <LeafDecor color="#F59E0B" />
          <div className="relative z-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#F59E0B25" }}>
              <TrendingDown className="w-4 h-4" style={{ color: "#F59E0B" }} />
            </div>
            <p className="text-sm font-semibold text-gray-700">Gastos del mes</p>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-extrabold text-gray-900 leading-tight">−${fmt(totalGastos)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{gastos.length} registro{gastos.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Balance */}
        <div className="rounded-2xl p-5 relative overflow-hidden flex flex-col gap-3" style={{ background: "#EEF2FF", minHeight: 140 }}>
          <LeafDecor color="#6366F1" />
          <div className="relative z-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#6366F125" }}>
              <Wallet className="w-4 h-4" style={{ color: "#6366F1" }} />
            </div>
            <p className="text-sm font-semibold text-gray-700">Balance</p>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-extrabold text-gray-900 leading-tight">
              {balance >= 0 ? "+" : "−"}${fmt(Math.abs(balance))}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{balance >= 0 ? "↑ Positivo" : "↓ Negativo"}</p>
          </div>
        </div>
      </div>

      {/* Sección media: donut + cuentas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Donut */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-800">Gastos por categoría</h2>
          <div className="flex-1 min-h-[180px]">
            {categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm font-medium">Sin gastos este mes</p>
              </div>
            ) : (
              <CategoryPieChart data={categoryData} />
            )}
          </div>
        </div>

        {/* Cuentas activas */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Cuentas activas</h2>
            <span className="text-xs text-gray-400">Este mes</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accountStats.map(ac => (
              <div
                key={ac.key}
                className="flex items-center gap-3 p-3.5 rounded-2xl relative overflow-hidden"
                style={{ background: ac.bg, border: `1px solid ${ac.color}20` }}
              >
                {/* Mini decorador */}
                <svg className="absolute bottom-0 right-0 pointer-events-none" width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <ellipse cx="50" cy="50" rx="35" ry="18" fill={ac.color} opacity="0.15" transform="rotate(-40 50 50)" />
                </svg>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: ac.color }}
                >
                  {ac.label}
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-sm font-bold text-gray-800">{ac.key}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{ac.count} movimiento{ac.count !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right flex-shrink-0 relative z-10">
                  <p className={`text-sm font-extrabold ${ac.neto >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {ac.neto >= 0 ? "+" : "−"}{fmtMonto(Math.abs(ac.neto), ac.key)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{ac.moneda} · {ac.neto >= 0 ? "disponible" : "gastado"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Todos los movimientos</h2>
          <span className="text-xs text-gray-400">{movimientos.length} registros</span>
        </div>

        {/* Cabecera */}
        <div className="hidden sm:grid gap-4 px-3 py-2 mb-1" style={{ gridTemplateColumns: "3fr 1fr 1fr 1fr auto" }}>
          {["Descripción", "Cuenta", "Usuario", "Monto", ""].map((col, i) => (
            <span key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{col}</span>
          ))}
        </div>
        <div className="h-px bg-gray-100 mb-2" />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-medium">Sin movimientos este mes</p>
            <p className="text-xs mt-1 text-gray-300">Usa el botón Nuevo para registrar uno</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {/* Desktop */}
            {movimientos.map(m => {
              const user = USERS.find(u => u.id === m.usuario_id);
              return (
                <li key={m.id} className="hidden sm:grid gap-4 items-center px-3 py-3.5 hover:bg-gray-50 rounded-xl transition-colors" style={{ gridTemplateColumns: "3fr 1fr 1fr 1fr auto" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: m.tipo === "gasto" ? "#FEF3C7" : "#D1FAE5" }}>
                      {m.tipo === "gasto" ? <TrendingDown className="w-4 h-4 text-amber-500" /> : <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{m.descripcion || m.categoria || "Sin descripción"}</p>
                      <p className="text-xs text-gray-400">{m.categoria} · {new Date(m.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                  <div><CuentaBadge cuentaKey={m.cuenta || m.moneda} /></div>
                  <div>
                    {user && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ backgroundColor: user.color + "20", color: user.color }}>
                        {user.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className={`text-sm font-extrabold ${m.tipo === "gasto" ? "text-amber-600" : "text-emerald-600"}`}>
                      {m.tipo === "gasto" ? "−" : "+"}{fmtMonto(m.monto, m.cuenta || m.moneda)}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(m.id)} className="text-gray-200 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}

            {/* Mobile */}
            {movimientos.map(m => {
              const user = USERS.find(u => u.id === m.usuario_id);
              return (
                <li key={`mob-${m.id}`} className="sm:hidden flex items-center gap-3 py-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: m.tipo === "gasto" ? "#FEF3C7" : "#D1FAE5" }}>
                    {m.tipo === "gasto" ? <TrendingDown className="w-4 h-4 text-amber-500" /> : <TrendingUp className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{m.descripcion || m.categoria || "Sin descripción"}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">{m.categoria}</span>
                      <CuentaBadge cuentaKey={m.cuenta || m.moneda} />
                      {user && <span className="text-[10px] font-bold" style={{ color: user.color }}>{user.name}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-extrabold ${m.tipo === "gasto" ? "text-amber-600" : "text-emerald-600"}`}>
                      {m.tipo === "gasto" ? "−" : "+"}${fmt(m.monto)}
                    </p>
                    <p className="text-[10px] text-gray-300">{new Date(m.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</p>
                  </div>
                  <button onClick={() => handleDelete(m.id)} className="text-gray-200 hover:text-red-400 transition-colors ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Nuevo movimiento</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              {/* Tipo */}
              <div className="flex rounded-xl overflow-hidden border border-gray-100">
                {(["gasto", "ingreso"] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => { setTipo(t); setCategoria(t === "gasto" ? CATEGORIAS_GASTO[0] : CATEGORIAS_INGRESO[0]); }}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                      tipo === t ? (t === "gasto" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white")
                      : "bg-white text-gray-400 hover:bg-gray-50"}`}
                  >
                    {t === "gasto" ? "💸 Gasto" : "💰 Ingreso"}
                  </button>
                ))}
              </div>

              {/* Monto */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Monto</label>
                <input type="number" min="0.01" step="0.01" placeholder="0.00" value={monto}
                  onChange={e => setMonto(e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
              </div>

              {/* Cuenta */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Cuenta</label>
                <div className="grid grid-cols-3 gap-2">
                  {CUENTAS.map(c => (
                    <button key={c.key} type="button" onClick={() => setCuenta(c.key)}
                      className="py-2 px-3 rounded-xl text-xs font-bold transition-all border"
                      style={{ backgroundColor: cuenta === c.key ? c.color : c.bg, color: cuenta === c.key ? "#fff" : c.color, borderColor: c.color + "40" }}>
                      {c.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Categoría</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-white">
                  {(tipo === "gasto" ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  Descripción <span className="text-gray-300 font-normal">(opcional)</span>
                </label>
                <input type="text" placeholder="Ej. Supermercado, Netflix..." value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ backgroundColor: activeUser?.color ?? "#7C3AED" }}>
                {saving ? "Guardando..." : "Guardar movimiento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
