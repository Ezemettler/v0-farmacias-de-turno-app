// lib/fechaArgentina.ts

// Devuelve la fecha de HOY en Argentina en formato YYYY-MM-DD
export function hoyArgentinaYYYYMMDD(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(p => p.type === "year")?.value;
  const month = parts.find(p => p.type === "month")?.value;
  const day = parts.find(p => p.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("No se pudo calcular la fecha en Argentina.");
  }

  return `${year}-${month}-${day}`;
}


export function fechaHumanaArgentina(yyyyMmDd: string): string {
  // Usamos mediodía UTC para evitar que por huso horario se vaya al día anterior/siguiente
  const date = new Date(`${yyyyMmDd}T12:00:00Z`);

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
