import { createClient } from "@supabase/supabase-js"

// Cliente server-side únicamente — nunca importar en Client Components.
// Usa la anon key (Row Level Security del lado de Supabase) para lecturas del frontend.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
)
