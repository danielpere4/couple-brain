"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser, USERS } from "@/context/UserContext";

type Nota = {
  id: string;
  titulo: string;
  contenido: string;
  tipo: string;
  usuario_id: number;
  fecha: string;
};

export default function NotasPage() {
  const { activeUser } = useUser();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Nota | null>(null);

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchNotas() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("notas")
        .select("*")
        .order("fecha", { ascending: false });
      setNotas(data ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchNotas(); }, []);

  function openNew() {
    setEditing(null);
    setTitulo("");
    setContenido("");
    setShowForm(true);
  }

  function openEdit(nota: Nota) {
    setEditing(nota);
    setTitulo(nota.titulo ?? "");
    setContenido(nota.contenido ?? "");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() && !contenido.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase
          .from("notas")
          .update({ titulo, contenido })
          .eq("id", editing.id);
        setNotas(ns => ns.map(n => n.id === editing.id ? { ...n, titulo, contenido } : n));
      } else {
        const { data } = await supabase
          .from("notas")
          .insert({
            titulo,
            contenido,
            tipo: "nota",
            usuario_id: activeUser?.id,
            fecha: new Date().toISOString(),
          })
          .select()
          .single();
        if (data) setNotas(ns => [data, ...ns]);
      }
      setShowForm(false);
    } catch {}
    setSaving(false);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from("notas").delete().eq("id", id);
    setNotas(ns => ns.filter(n => n.id !== id));
  }

  const NOTE_COLORS = [
    "bg-amber-50", "bg-sky-50", "bg-emerald-50",
    "bg-violet-50", "bg-rose-50", "bg-orange-50",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notas</h1>
          <p className="text-gray-400 mt-1 text-sm">Ideas y recordatorios del hogar</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: activeUser?.color ?? "#7C3AED" }}
        >
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notas.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm font-medium">Sin notas aún</p>
          <p className="text-xs mt-1 text-gray-300">Usa el botón Nueva para crear una</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notas.map((n, i) => {
            const user = USERS.find(u => u.id === n.usuario_id);
            return (
              <div
                key={n.id}
                className={`${NOTE_COLORS[i % NOTE_COLORS.length]} rounded-2xl p-5 group relative cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => openEdit(n)}
              >
                {n.titulo && (
                  <p className="font-semibold text-gray-800 mb-2 pr-6 truncate">{n.titulo}</p>
                )}
                {n.contenido && (
                  <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">{n.contenido}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5">
                  {user ? (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: user.color + "22", color: user.color }}
                    >
                      {user.name}
                    </span>
                  ) : <span />}
                  <p className="text-[10px] text-gray-400">
                    {new Date(n.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <button
                  onClick={e => handleDelete(n.id, e)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">{editing ? "Editar nota" : "Nueva nota"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Título <span className="text-gray-300 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Lista del super, Recordatorio..."
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Contenido</label>
                <textarea
                  placeholder="Escribe tu nota aquí..."
                  value={contenido}
                  onChange={e => setContenido(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: activeUser?.color ?? "#7C3AED" }}
              >
                {saving ? "Guardando..." : editing ? "Actualizar" : "Guardar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
