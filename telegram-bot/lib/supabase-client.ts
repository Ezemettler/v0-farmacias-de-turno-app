import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY")
}

// Service role key: bypass Row Level Security para escrituras del bot
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
