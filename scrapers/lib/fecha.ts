const TZ = "America/Argentina/Buenos_Aires"

export function hoyArgentinaYYYYMMDD(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/**
 * Convierte hora local Argentina ("08:30") + fecha ("2025-12-23") a ISO con offset.
 * Argentina no tiene horario de verano desde 2008, offset siempre -03:00.
 */
export function parseARTimeToISO(fecha: string, horaLocal: string): string | undefined {
  if (!horaLocal || !/^\d{1,2}:\d{2}$/.test(horaLocal.trim())) return undefined
  const hora = horaLocal.trim().padStart(5, "0")
  return `${fecha}T${hora}:00-03:00`
}

/** Devuelve la fecha del día siguiente en formato YYYY-MM-DD. */
export function siguienteDia(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
}

/**
 * Parsea "DD/MM/YYYY HH:MM" o "YYYY-MM-DD HH:MM" a ISO con offset -03:00.
 */
export function parseARDateTimeToISO(raw: string): string | undefined {
  if (!raw) return undefined

  // Formato: "23/12/2025 08:30"
  const matchDMY = raw.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}:\d{2})$/)
  if (matchDMY) {
    const [, d, m, y, time] = matchDMY
    return `${y}-${m}-${d}T${time.padStart(5, "0")}:00-03:00`
  }

  // Formato: "2025-12-23 08:30" o ISO
  const matchISO = raw.trim().match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}:\d{2})/)
  if (matchISO) {
    const [, date, time] = matchISO
    return `${date}T${time.padStart(5, "0")}:00-03:00`
  }

  return undefined
}
