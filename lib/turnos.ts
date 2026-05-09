import { supabase } from "./supabase"
import { hoyArgentinaYYYYMMDD } from "./fechaArgentina"
import type { TurnoRow } from "./turno-utils"

export type { TurnoRow }

export async function fetchTurnos(ciudadSlug: string): Promise<TurnoRow[]> {
  const fecha = hoyArgentinaYYYYMMDD()

  const { data, error } = await supabase
    .from("farmacias_turno")
    .select(
      "ciudad_slug, fecha_turno, nombre_farmacia, direccion, telefono, inicio_turno, fin_turno, notas"
    )
    .eq("ciudad_slug", ciudadSlug)
    .eq("fecha_turno", fecha)
    .order("nombre_farmacia")

  if (error) {
    console.error(`[fetchTurnos] Error para "${ciudadSlug}":`, error.message)
    return []
  }

  return (data ?? []) as TurnoRow[]
}
