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

// Convierte YYYY-MM-DD a texto humano en español (Argentina), ej: "sábado 20 de diciembre"
export function fechaHumanaArgentina(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
