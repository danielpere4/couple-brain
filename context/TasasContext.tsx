"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Tasas = {
  VES: number; // Bs por 1 USD
  COP: number; // COP por 1 USD
  loading: boolean;
  lastUpdate: string;
};

type TasasContextType = Tasas & {
  setTasa: (moneda: "VES" | "COP", valor: number) => void;
  toUSD: (monto: number, moneda: string) => number;
};

const TasasContext = createContext<TasasContextType | null>(null);

const STORAGE_KEY = "couple-brain-tasas";
const CACHE_HOURS = 6; // refrescar cada 6 horas

export function TasasProvider({ children }: { children: ReactNode }) {
  const [tasas, setTasas] = useState<Omit<Tasas, "loading">>({
    VES: 0,
    COP: 0,
    lastUpdate: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasas() {
      // Revisar cache
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const hoursOld = (Date.now() - parsed.timestamp) / 1000 / 3600;
          if (hoursOld < CACHE_HOURS) {
            setTasas({ VES: parsed.VES, COP: parsed.COP, lastUpdate: parsed.lastUpdate });
            setLoading(false);
            return;
          }
        }
      } catch {}

      // Fetch desde API
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        if (data.result === "success") {
          const VES = Math.round(data.rates.VES);
          const COP = Math.round(data.rates.COP);
          const lastUpdate = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
          setTasas({ VES, COP, lastUpdate });
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ VES, COP, lastUpdate, timestamp: Date.now() }));
        }
      } catch {
        // Si falla la API, usar fallback
        setTasas(prev => ({ ...prev, VES: prev.VES || 90, COP: prev.COP || 4200, lastUpdate: "manual" }));
      }
      setLoading(false);
    }

    fetchTasas();
  }, []);

  function setTasa(moneda: "VES" | "COP", valor: number) {
    const nuevas = { ...tasas, [moneda]: valor, lastUpdate: "manual" };
    setTasas(nuevas);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...nuevas, timestamp: Date.now() }));
    } catch {}
  }

  function toUSD(monto: number, moneda: string): number {
    if (moneda === "VES") return tasas.VES > 0 ? monto / tasas.VES : 0;
    if (moneda === "COP") return tasas.COP > 0 ? monto / tasas.COP : 0;
    return monto; // USD ya es USD
  }

  return (
    <TasasContext.Provider value={{ ...tasas, loading, setTasa, toUSD }}>
      {children}
    </TasasContext.Provider>
  );
}

export function useTasas() {
  const ctx = useContext(TasasContext);
  if (!ctx) throw new Error("useTasas must be inside TasasProvider");
  return ctx;
}
