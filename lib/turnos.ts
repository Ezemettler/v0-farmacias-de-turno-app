import { supabase } from "./supabase"
import type { TurnoRow } from "./turno-utils"
import { predecirLetraTurnoSanNicolas } from "./prediccion-san-nicolas"
import { ROSTER_SAN_NICOLAS } from "./roster-san-nicolas"

export type { TurnoRow }

export interface ProximoTurno {
  turnos: TurnoRow[]
  minutosHastaInicio: number
  esPrediccion: boolean
}

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

// Fecha (YYYY-MM-DD, hora Argentina) del próximo corte de turno a las
// 08:30 que todavía no tiene datos reales cargados — hoy mismo si
// todavía no pasaron las 08:30, si no mañana.
function proximaFechaSinCargar(): string {
  const ahora = new Date()
  const fechaAR = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora)
  const horaAR = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ahora)

  if (horaAR < "08:30") return fechaAR

  const [y, m, d] = fechaAR.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
}

// Próximo turno a cargo después del vigente — se usa para avisar con
// anticipación qué farmacia(s) toman la posta, sobre todo útil cuando
// falta poco para el cambio (ver components/next-shift.tsx). Para San
// Nicolás, si todavía no hay un turno real cargado para el próximo
// corte, se completa con la predicción del ciclo de 12 días (misma
// lógica que usa el scraper como respaldo) en vez de dejar la sección
// vacía — queda marcada como predicción para que el componente lo
// aclare en el texto.
export async function fetchProximoTurno(ciudadSlug: string): Promise<ProximoTurno | null> {
  const ahora = new Date().toISOString()

  const { data, error } = await supabase
    .from("farmacias_turno")
    .select("ciudad_slug, fecha_turno, nombre_farmacia, direccion, telefono, inicio_turno, fin_turno, notas")
    .eq("ciudad_slug", ciudadSlug)
    .gt("inicio_turno", ahora)
    .order("inicio_turno", { ascending: true })
    .limit(50)

  if (error) {
    console.error("[fetchProximoTurno] Error Supabase:", error.message)
    return null
  }

  if (data && data.length > 0) {
    const proximoInicio = data[0].inicio_turno as string
    const turnos = data.filter((r) => r.inicio_turno === proximoInicio) as TurnoRow[]
    const minutosHastaInicio = Math.round((new Date(proximoInicio).getTime() - Date.now()) / 60_000)
    return { turnos, minutosHastaInicio, esPrediccion: false }
  }

  if (ciudadSlug !== "san-nicolas") return null

  const fecha = proximaFechaSinCargar()
  const [y, m, d] = fecha.split("-").map(Number)
  const fechaSiguiente = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
  const inicio_turno = `${fecha}T08:30:00-03:00`
  const fin_turno = `${fechaSiguiente}T08:30:00-03:00`
  const grupo = predecirLetraTurnoSanNicolas(fecha)

  const turnos: TurnoRow[] = ROSTER_SAN_NICOLAS[grupo].map((f) => ({
    ciudad_slug: ciudadSlug,
    fecha_turno: fecha,
    nombre_farmacia: f.nombre,
    direccion: f.direccion,
    telefono: null,
    inicio_turno,
    fin_turno,
    notas: "Turno estimado según el ciclo de 12 días — puede variar.",
  }))

  const minutosHastaInicio = Math.round((new Date(inicio_turno).getTime() - Date.now()) / 60_000)
  return { turnos, minutosHastaInicio, esPrediccion: true }
}
