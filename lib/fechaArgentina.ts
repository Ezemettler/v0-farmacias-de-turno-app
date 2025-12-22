// Devuelve la fecha de HOY en Argentina en formato YYYY-MM-DD
// lib/fechaArgentina.ts
export function hoyArgentinaYYYYMMDD(): string {
  // en-CA devuelve YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function hoyArgentinaHumano(): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}
