// El turno de San Nicolás rota en un ciclo fijo de 12 días (A→B→...→L→A),
// sin relación con el día de la semana — confirmado contra 30 días
// seguidos de capturas (agosto-septiembre 2026) sin excepción, salvo el
// 1-2/08 (probable reordenamiento de padrón a inicio de mes). Copia de
// scrapers/lib/prediccion-san-nicolas.ts (workspaces separados, sin
// import compartido) — se usa acá para la sección "Próximo turno" cuando
// todavía no hay un turno real cargado para el día siguiente.
const LETRAS_TURNO = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
const FECHA_REFERENCIA = "2026-08-06" // confirmado a mano: Turno A

export function predecirLetraTurnoSanNicolas(fechaYYYYMMDD: string): string {
  const [y1, m1, d1] = FECHA_REFERENCIA.split("-").map(Number)
  const [y2, m2, d2] = fechaYYYYMMDD.split("-").map(Number)
  const ref = Date.UTC(y1, m1 - 1, d1)
  const objetivo = Date.UTC(y2, m2 - 1, d2)
  const diffDias = Math.round((objetivo - ref) / 86_400_000)
  const idx = ((diffDias % 12) + 12) % 12
  return LETRAS_TURNO[idx]
}
