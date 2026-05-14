import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    "[CoupleBrain] Faltan variables de entorno de Supabase.\n" +
      "Copia .env.local.example → .env.local y rellena las credenciales."
  );
}

// Usa placeholder si no hay credenciales para evitar un crash en módulo.
// Las peticiones fallarán con network error (capturado en try/catch) hasta
// que se configure .env.local con credenciales reales.
// auth.persistSession:false evita que supabase acceda a localStorage
// durante la inicialización — necesario para no romper el SSR de Next.js.
export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  key ?? "placeholder-anon-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
