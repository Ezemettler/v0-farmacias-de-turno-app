const TZ = "America/Argentina/Buenos_Aires"

export function hoyArgentinaYYYYMMDD(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/** Convierte hora local Argentina ("08:30") + fecha ("2026-08-30") a ISO con offset -03:00. */
export function horaLocalAISO(fecha: string, horaLocal: string): string | undefined {
  if (!horaLocal || !/^\d{1,2}:\d{2}$/.test(horaLocal.trim())) return undefined
  const hora = horaLocal.trim().padStart(5, "0")
  return `${fecha}T${hora}:00-03:00`
}

export function siguienteDia(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
}
