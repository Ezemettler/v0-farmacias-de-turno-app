import { hoyArgentinaYYYYMMDD, parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ICityScraper, ScrapedTurno, ScraperResult } from "../../lib/types.js"

// Villa Tesei, Buenos Aires — mismo sistema que Morón/Castelar/Haedo/
// Hurlingham/Ituzaingó (ver scrapers/scrapers/moron/index.ts), acá con 11
// grupos (A-K). Confirmado a mano contra los calendarios de septiembre y
// octubre 2026 (61 días, cero excepciones): ciclo de 11 días. Se extiende
// hacia el futuro sin esperar confirmación mensual.
//
// Cada grupo tiene 1 farmacia propia + "24 Dia y Noche S.C.S." fija. El
// Grupo K es especial: "Lidia S.C.S." tiene dos sucursales (Av. Vergara
// 1110 y Alvarez Prado 3794) — confirmado con el usuario que son 2
// direcciones reales de la misma farmacia, no un error de captura. Se
// cargan como dos filas con nombres distintos para no pisarse en la
// clave única (ciudad_slug, fecha_turno, nombre_farmacia).
const FECHA_REFERENCIA = "2026-09-05" // confirmado a mano: Grupo A

const GRUPOS: Record<string, ScrapedTurno[]> = {
  A: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "ARRUBE", direccion: "Pedro Diaz 1147", telefono: "5079-0188" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
  B: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "D'ONOFRIO", direccion: "Av. Vergara 1110", telefono: "4450-6801" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
  C: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "CARACCI ORTIZ", direccion: "Av Pedro Diaz 399", telefono: "4459-7196" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
  D: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "GUAYRA", direccion: "Guayra 4131" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
  E: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "LORENZO", direccion: "Juan Jufre 299", telefono: "4450-8685" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
  F: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "BONOMO", direccion: "Einstein 228", telefono: "4450-6108" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
  G: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "GENERAL", direccion: "Pedro Diaz 817", telefono: "4459-6206" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
  H: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "DEMAYO", direccion: "Mario Bravo 417", telefono: "4450-0607" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
  I: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "PRINCIPAL TESEI", direccion: "Av. Vergara 2284", telefono: "7544-3296" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
  J: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "URBANO", direccion: "Ontiveros 4593", telefono: "4459-9390" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
  K: [
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "LIDIA S.C.S.", direccion: "Av. Vergara 1110", telefono: "7705-5729" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "LIDIA S.C.S. (ALVAREZ PRADO)", direccion: "Alvarez Prado 3794", telefono: "11-4439-6856" },
    { ciudad_slug: "villa-tesei", fecha_turno: "", nombre_farmacia: "24 DIA Y NOCHE S.C.S.", direccion: "Av. Vergara 2081", telefono: "6089-0684" },
  ],
}

const LETRAS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]

export function predecirGrupoVillaTesei(fechaYYYYMMDD: string): string {
  const [y1, m1, d1] = FECHA_REFERENCIA.split("-").map(Number)
  const [y2, m2, d2] = fechaYYYYMMDD.split("-").map(Number)
  const ref = Date.UTC(y1, m1 - 1, d1)
  const objetivo = Date.UTC(y2, m2 - 1, d2)
  const diffDias = Math.round((objetivo - ref) / 86_400_000)
  const idx = ((diffDias % 11) + 11) % 11
  return LETRAS[idx]
}

export class VillaTeseiScraper implements ICityScraper {
  readonly ciudad_slug = "villa-tesei"
  readonly scraper_key = "central_oeste_calendario"

  async scrape(fechaAR?: string): Promise<ScraperResult> {
    const fecha = fechaAR ?? hoyArgentinaYYYYMMDD()
    const grupo = predecirGrupoVillaTesei(fecha)
    logger.info(`[villa-tesei] Grupo calculado para ${fecha}: ${grupo}`)

    const inicio_turno = parseARTimeToISO(fecha, "08:30")
    const fin_turno = parseARTimeToISO(siguienteDia(fecha), "08:30")

    const rows: ScrapedTurno[] = GRUPOS[grupo].map((f) => ({
      ...f,
      fecha_turno: fecha,
      inicio_turno,
      fin_turno,
    }))

    return {
      ciudad_slug: this.ciudad_slug,
      status: "success",
      rows,
      source_url: "calendario Central Oeste (calculado, sin fetch — ver comentario en el archivo)",
    }
  }
}

export const villaTeseiScraper = new VillaTeseiScraper()
