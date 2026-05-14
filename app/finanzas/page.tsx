"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser, USERS } from "@/context/UserContext";

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

const CATEGORIAS_GASTO = [
  "Alimentación", "Transporte", "Vivienda", "Salud",
  "Entretenimiento", "Ropa", "Servicios", "Educación", "Otro",
];
const CATEGORIAS_INGRESO = ["Sueldo", "Freelance", "Regalo", "Inversión", "Otro"];

function fmt(n: number) {
  return n.toLocaleString("es-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FinanzasPage() {
  const { activeUser } = useUser();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO[0]);
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchMovimientos() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("movimientos")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(200);
      setMovimientos(data ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchMovimientos(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0) return;
    setSaving(true);
    try {
      await supabase.from("movimientos").insert({
        tipo,
        monto: parseFloat(monto),
        moneda: "USD",
        categoria,
        descripcion,
        usuario_id: activeUser?.id,
        fecha: new Date().toISOString(),
      });
      setMonto("");
      setDescripcion("");
      setShowForm(false);
      fetchMovimientos();
    } catch {}
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("movimientos").delete().eq("id", id);
    setMovimientos(ms => ms.filter(m => m.id !== id));
  }

  function openForm() {
    setTipo("gasto");
    setCategoria(CATEGORIAS_GASTO[0]);
    setMonto("");
    setDescripcion("");
    setShowForm(true);
  }

  const totalGastos = movimientos.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
  const totalIngresos = movimientos.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-gray-400 mt-1 text-sm">Gastos e ingresos del hogar</p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: activeUser?.color ?? "#7C3AED" }}
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total gastos</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">${fmt(totalGastos)}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total ingresos</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">${fmt(totalIngresos)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">
          Todos los movimientos
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-sm font-medium">Sin movimientos aún</p>
            <p className="text-xs mt-1 text-gray-300">Usa el botón Agregar para registrar uno</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {movimientos.map(m => {
              const user = USERS.find(u => u.id === m.usuario_id);
              return (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{m.categoria}</span>
                      {user && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: user.color + "22", color: user.color }}
                        >
                          {user.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${m.tipo === "gasto" ? "text-amber-600" : "text-emerald-600"}`}>
                      {m.tipo === "gasto" ? "−" : "+"}${fmt(m.monto)}
                    </p>
                    <p className="text-[10px] text-gray-300">
                      {new Date(m.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="ml-1 text-gray-200 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Nuevo movimiento</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="flex rounded-xl overflow-hidden border border-gray-100">
                {(["gasto", "ingreso"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTipo(t);
                      setCategoria(t === "gasto" ? CATEGORIAS_GASTO[0] : CATEGORIAS_INGRESO[0]);
                    }}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      tipo === t
                        ? t === "gasto" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {t === "gasto" ? "Gasto" : "Ingreso"}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Monto (USD)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Categoría</label>
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                >
                  {(tipo === "gasto" ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO).map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Descripción <span className="text-gray-300 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Supermercado, Netflix..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: activeUser?.color ?? "#7C3AED" }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
