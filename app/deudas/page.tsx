"use client";

import { useState, useEffect } from "react";
import { Plus, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser, USERS } from "@/context/UserContext";

type Deuda = {
  id: string;
  descripcion: string;
  monto: number;
  moneda: string;
  direccion: "nos_deben" | "debemos";
  persona: string;
  pagada: boolean;
  usuario_id: number;
  fecha: string;
};

function fmt(n: number) {
  return n.toLocaleString("es-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DeudasPage() {
  const { activeUser } = useUser();
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [direccion, setDireccion] = useState<"nos_deben" | "debemos">("debemos");
  const [persona, setPersona] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchDeudas() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("deudas")
        .select("*")
        .order("fecha", { ascending: false });
      setDeudas(data ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchDeudas(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0) return;
    setSaving(true);
    try {
      await supabase.from("deudas").insert({
        descripcion,
        monto: parseFloat(monto),
        moneda: "USD",
        direccion,
        persona,
        pagada: false,
        usuario_id: activeUser?.id,
        fecha: new Date().toISOString(),
      });
      setDescripcion("");
      setMonto("");
      setPersona("");
      setShowForm(false);
      fetchDeudas();
    } catch {}
    setSaving(false);
  }

  async function markAsPaid(id: string) {
    await supabase.from("deudas").update({ pagada: true }).eq("id", id);
    setDeudas(ds => ds.map(d => d.id === id ? { ...d, pagada: true } : d));
  }

  async function handleDelete(id: string) {
    await supabase.from("deudas").delete().eq("id", id);
    setDeudas(ds => ds.filter(d => d.id !== id));
  }

  const pendientes = deudas.filter(d => !d.pagada);
  const pagadas = deudas.filter(d => d.pagada);
  const totalNosDeben = pendientes.filter(d => d.direccion === "nos_deben").reduce((s, d) => s + d.monto, 0);
  const totalDebemos = pendientes.filter(d => d.direccion === "debemos").reduce((s, d) => s + d.monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deudas</h1>
          <p className="text-gray-400 mt-1 text-sm">Lo que deben y lo que debemos</p>
        </div>
        <button
          onClick={() => { setDireccion("debemos"); setDescripcion(""); setMonto(""); setPersona(""); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: activeUser?.color ?? "#7C3AED" }}
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nos deben</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">${fmt(totalNosDeben)}</p>
          <p className="text-xs text-emerald-500 mt-0.5">
            {pendientes.filter(d => d.direccion === "nos_deben").length} pendiente
            {pendientes.filter(d => d.direccion === "nos_deben").length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-rose-50 rounded-2xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Debemos</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">${fmt(totalDebemos)}</p>
          <p className="text-xs text-rose-400 mt-0.5">
            {pendientes.filter(d => d.direccion === "debemos").length} pendiente
            {pendientes.filter(d => d.direccion === "debemos").length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">
          Pendientes ({pendientes.length})
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pendientes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-sm font-medium">Sin deudas pendientes</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {pendientes.map(d => {
              const user = USERS.find(u => u.id === d.usuario_id);
              return (
                <li key={d.id} className="flex items-center gap-3 py-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${d.direccion === "nos_deben" ? "bg-emerald-400" : "bg-rose-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{d.descripcion}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {d.persona && (
                        <span className="text-xs text-gray-400">
                          {d.direccion === "nos_deben" ? `${d.persona} nos debe` : `Debemos a ${d.persona}`}
                        </span>
                      )}
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
                  <p className={`text-sm font-bold flex-shrink-0 ${d.direccion === "nos_deben" ? "text-emerald-600" : "text-rose-600"}`}>
                    ${fmt(d.monto)}
                  </p>
                  <button
                    onClick={() => markAsPaid(d.id)}
                    title="Marcar como pagada"
                    className="text-gray-200 hover:text-emerald-500 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-gray-200 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pagadas.length > 0 && (
        <div className="bg-white rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Pagadas ({pagadas.length})
          </h2>
          <ul className="divide-y divide-gray-50">
            {pagadas.map(d => (
              <li key={d.id} className="flex items-center gap-3 py-3 opacity-50">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 line-through">{d.descripcion}</p>
                  {d.persona && <p className="text-xs text-gray-400">{d.persona}</p>}
                </div>
                <p className="text-sm text-gray-400">${fmt(d.monto)}</p>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-gray-200 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Nueva deuda</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="flex rounded-xl overflow-hidden border border-gray-100">
                {(["debemos", "nos_deben"] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDireccion(d)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      direccion === d
                        ? d === "debemos" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {d === "debemos" ? "Debemos" : "Nos deben"}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Descripción</label>
                <input
                  type="text"
                  placeholder="Ej. Préstamo, Deuda del carro..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
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
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Persona <span className="text-gray-300 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Nombre de la persona"
                  value={persona}
                  onChange={e => setPersona(e.target.value)}
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
