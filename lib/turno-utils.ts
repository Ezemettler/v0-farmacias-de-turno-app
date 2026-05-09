export interface TurnoRow {
  ciudad_slug: string
  fecha_turno: string
  nombre_farmacia: string
  direccion: string
  telefono: string | null
  inicio_turno: string | null
  fin_turno: string | null
  notas: string | null
}

// ---------------------------------------------------------------------------
// Parseo de fechas/horas
// Consolidado desde las 7 pages de ciudad (antes estaba duplicado en cada una)
// ---------------------------------------------------------------------------

function parseARDateTime(raw: string): { isoDate: string; minutes: number } | null {
  const s = String(raw ?? "").trim()
  if (!s) return null

  // Formato "D/M/YYYY H:MM" o "DD/MM/YYYY HH:MM"
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/)
  if (m) {
    const [, d1, m1, yyyy, h1, MM] = m
    const dd = d1.padStart(2, "0")
    const mm = m1.padStart(2, "0")
    const HH = h1.padStart(2, "0")
    return { isoDate: `${yyyy}-${mm}-${dd}`, minutes: Number(HH) * 60 + Number(MM) }
  }

  // ISO / DateTime string
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null

  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)

  const [HH, MM] = time.split(":")
  return { isoDate, minutes: Number(HH) * 60 + Number(MM) }
}

function nowArgentinaParts(): { isoDate: string; minutes: number } {
  const d = new Date()
  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)

  const [HH, MM] = time.split(":")
  return { isoDate, minutes: Number(HH) * 60 + Number(MM) }
}

export function isOnDutyNow(row: Pick<TurnoRow, "inicio_turno" | "fin_turno">): boolean {
  const ini = parseARDateTime(String(row.inicio_turno ?? ""))
  const fin = parseARDateTime(String(row.fin_turno ?? ""))
  if (!ini || !fin) return false

  const now = nowArgentinaParts()
  const key = (d: string, m: number) => `${d} ${String(m).padStart(4, "0")}`

  return (
    key(now.isoDate, now.minutes) >= key(ini.isoDate, ini.minutes) &&
    key(now.isoDate, now.minutes) < key(fin.isoDate, fin.minutes)
  )
}

export function formatARDateTime(raw: string | null): string {
  if (!raw) return ""
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ""

  const date = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
  }).format(d)

  const time = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)

  return `${date} ${time}`
}
