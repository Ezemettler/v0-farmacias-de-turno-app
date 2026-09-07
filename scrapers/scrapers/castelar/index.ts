import { hoyArgentinaYYYYMMDD, parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ICityScraper, ScrapedTurno, ScraperResult } from "../../lib/types.js"

// Castelar, Buenos Aires — mismo tipo de sistema que Morón (ver
// scrapers/scrapers/moron/index.ts): sin URL para scrapear, cartel con
// grupos fijos de farmacias y un calendario mensual de qué grupo
// corresponde a cada día. Acá son 18 grupos (A-R), no 10. Confirmado a
// mano contra los calendarios oficiales de septiembre y octubre 2026 (61
// días, cero excepciones): la letra avanza un lugar por día calendario,
// sin relación con el día de la semana, en un ciclo de 18 días. A pedido
// explícito del usuario, se extiende el ciclo hacia el futuro sin esperar
// confirmación mensual.
const FECHA_REFERENCIA = "2026-09-07" // confirmado a mano: Grupo A

const GRUPOS: Record<string, ScrapedTurno[]> = {
  A: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "AGUIRRE", direccion: "Santa Rosa 1109", telefono: "4661-5726" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  B: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NUEVA FARMACIA CASTELAR S.C.S.", direccion: "Santa Rosa 1409", telefono: "6069-9887" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  C: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "FRASCINO", direccion: "Buenos Aires 559", telefono: "4629-1006" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  D: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "MC CORMACK", direccion: "Arias 3027", telefono: "4661-6260" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  E: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "ROMERO", direccion: "Leandro N. Alem 2917", telefono: "4486-3500" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  F: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "FERRAN", direccion: "Timbúes 860", telefono: "4627-5506" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  G: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "PLAZA OESTE", direccion: "Juan Manuel de Rosas 701", telefono: "6073-0107" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  H: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "CENTRAL OESTE SANTA ROSA", direccion: "Machado 3575", telefono: "4624-2929" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  I: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "ROSSI", direccion: "Inocencio Arias 2408", telefono: "4628-2525" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  J: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "RODRIGUEZ ZAMPIERI", direccion: "Santa Rosa 2481", telefono: "4661-2829" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  K: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "BIANCHI", direccion: "Alem 1782", telefono: "4489-1268" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  L: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "ANDRADE", direccion: "Nicolás Granada 3182", telefono: "7518-1958" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  M: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "LIPOFER SCS", direccion: "Martín Gil 899", telefono: "11-5574-1295" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  N: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "FIORILLI", direccion: "Curutchet 2418", telefono: "4483-4466" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  O: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "BAZAN", direccion: "Chivilcoy 2202", telefono: "4628-0570" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  P: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "MARQUEZ", direccion: "Zeballos 2003", telefono: "2101-6601" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  Q: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "ARIASPHARMA SCS", direccion: "Arias 3376", telefono: "4624-2736" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
  R: [
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "GRANDA", direccion: "Av. Zeballos 2975 entre Reverdo y Andrade", telefono: "4624-2120" },
    { ciudad_slug: "castelar", fecha_turno: "", nombre_farmacia: "NIJUL 24HS S.C.S.", direccion: "Carlos Casares 1279", telefono: "4826-8757" },
  ],
}

const LETRAS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"]

export function predecirGrupoCastelar(fechaYYYYMMDD: string): string {
  const [y1, m1, d1] = FECHA_REFERENCIA.split("-").map(Number)
  const [y2, m2, d2] = fechaYYYYMMDD.split("-").map(Number)
  const ref = Date.UTC(y1, m1 - 1, d1)
  const objetivo = Date.UTC(y2, m2 - 1, d2)
  const diffDias = Math.round((objetivo - ref) / 86_400_000)
  const idx = ((diffDias % 18) + 18) % 18
  return LETRAS[idx]
}

export class CastelarScraper implements ICityScraper {
  readonly ciudad_slug = "castelar"
  readonly scraper_key = "central_oeste_calendario"

  async scrape(fechaAR?: string): Promise<ScraperResult> {
    const fecha = fechaAR ?? hoyArgentinaYYYYMMDD()
    const grupo = predecirGrupoCastelar(fecha)
    logger.info(`[castelar] Grupo calculado para ${fecha}: ${grupo}`)

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

export const castelarScraper = new CastelarScraper()
