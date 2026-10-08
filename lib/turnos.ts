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

// Cantidad de farmacias distintas que pasaron por el cronograma de esta
// ciudad — se usa en el párrafo descriptivo de cada página. Se normaliza
// mayúsculas/espacios antes de contar para no inflar el número con la
// misma farmacia cargada con distinta capitalización en corridas
// distintas (ej. "Guenier" vs "GUENIER").
export async function fetchCantidadFarmaciasRegistradas(ciudadSlug: string): Promise<number> {
  const { data, error } = await supabase
    .from("farmacias_turno")
    .select("nombre_farmacia")
    .eq("ciudad_slug", ciudadSlug)

  if (error) {
    console.error("[fetchCantidadFarmaciasRegistradas] Error Supabase:", error.message)
    return 0
  }

  const nombresUnicos = new Set(
    (data ?? []).map((r) => String(r.nombre_farmacia).trim().toUpperCase())
  )
  return nombresUnicos.size
}

// Slugs de ciudades con al menos una farmacia de turno vigente ahora
// mismo — se usa para el bloque de enlazado interno "Farmacias de turno
// en otras ciudades", así no se linkea a una página que hoy está vacía.
export async function fetchCiudadesConDatosHoy(): Promise<string[]> {
  const ahora = new Date().toISOString()

  const { data, error } = await supabase
    .from("farmacias_turno")
    .select("ciudad_slug")
    .lte("inicio_turno", ahora)
    .gte("fin_turno", ahora)

  if (error) {
    console.error("[fetchCiudadesConDatosHoy] Error Supabase:", error.message)
    return []
  }

  return [...new Set((data ?? []).map((r) => r.ciudad_slug as string))]
}
