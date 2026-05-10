import { supabase } from "./supabase"
import type { TurnoRow } from "./turno-utils"

export type { TurnoRow }

export async function fetchTurnos(ciudadSlug: string): Promise<TurnoRow[]> {
  const ahora = new Date().toISOString()

  console.log("[fetchTurnos] ciudad:", ciudadSlug)
  console.log("[fetchTurnos] ahora (UTC):", ahora)
  console.log(
    "[fetchTurnos] query: SELECT * FROM farmacias_turno",
    `WHERE ciudad_slug = '${ciudadSlug}'`,
    `AND inicio_turno <= '${ahora}'`,
    `AND fin_turno >= '${ahora}'`
  )

  const { data, error } = await supabase
    .from("farmacias_turno")
    .select(
      "ciudad_slug, fecha_turno, nombre_farmacia, direccion, telefono, inicio_turno, fin_turno, notas"
    )
    .eq("ciudad_slug", ciudadSlug)
    .lte("inicio_turno", ahora)
    .gte("fin_turno", ahora)
    .order("nombre_farmacia")

  if (error) {
    console.error("[fetchTurnos] Error Supabase:", error.message, error.details)
    return []
  }

  console.log("[fetchTurnos] resultados:", data?.length ?? 0)
  if (data && data.length > 0) {
    console.log("[fetchTurnos] primer row:", JSON.stringify(data[0]))
  } else {
    console.log("[fetchTurnos] sin resultados — verificar inicio_turno/fin_turno en la tabla")
  }

  return (data ?? []) as TurnoRow[]
}
