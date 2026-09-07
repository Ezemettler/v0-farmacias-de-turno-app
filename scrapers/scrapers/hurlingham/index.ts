import { hoyArgentinaYYYYMMDD, parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ICityScraper, ScrapedTurno, ScraperResult } from "../../lib/types.js"

// Hurlingham, Buenos Aires — mismo sistema que Morón/Castelar/Haedo (ver
// scrapers/scrapers/moron/index.ts), acá con 8 grupos (A-H). Confirmado a
// mano contra los calendarios oficiales de septiembre y octubre 2026 (61
// días, cero excepciones): ciclo de 8 días, avanza una letra por día
// calendario. Se extiende hacia el futuro sin esperar confirmación
// mensual, mismo criterio ya acordado para las demás.
const FECHA_REFERENCIA = "2026-09-08" // confirmado a mano: Grupo A

const GRUPOS: Record<string, ScrapedTurno[]> = {
  A: [
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "BUSONI", direccion: "Las Calandrias 2590", telefono: "4662-3615" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "FERNANDEZ", direccion: "Alfaro esq. Necochea 898", telefono: "4665-1595" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "PASTEUR", direccion: "Av. Vergara 4502", telefono: "4662-7216" },
  ],
  B: [
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "BEHIGO", direccion: "Jauretche 999", telefono: "4665-0667" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "BUSTAMANTE", direccion: "Eva Perón 2737", telefono: "4665-8500" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "MORENO", direccion: "Julio A. Roca 2184", telefono: "4665-0183" },
  ],
  C: [
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "NERI", direccion: "Argerich 1731", telefono: "4662-1469" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "VIÑAS", direccion: "Av. Vergara 3898", telefono: "4452-5359" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "ZUBRISKY", direccion: "Gral. Villegas 1489", telefono: "4768-6185" },
  ],
  D: [
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "ABAURREA", direccion: "Jauretche 1361/65", telefono: "4665-7488" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "GLANCZ", direccion: "Villegas 2325", telefono: "2195-6315" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "NAVARRO", direccion: "Av. Roca 2001", telefono: "4452-2157" },
  ],
  E: [
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "BRAVI", direccion: "Av. Vergara 4129", telefono: "4452-8521" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "BO", direccion: "Bustamante 2202", telefono: "5430-4040" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "SALARI", direccion: "Julio A. Roca 2898", telefono: "4662-1972" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "BARRIENTOS", direccion: "Acoyte esq. Gorriti 3312", telefono: "4665-7472" },
  ],
  F: [
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "AMOROSO", direccion: "Julio A. Roca 1790", telefono: "4665-3023" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "BATTAGLIA", direccion: "Gral. A. Rodriguez 2050", telefono: "4452-6003" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "BRUSSOLO", direccion: "Marquez de Aviles 1832", telefono: "7397-3346" },
  ],
  G: [
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "FREITAS", direccion: "Bolívar 2581", telefono: "4665-4589" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "HAMPEL HAHN", direccion: "Av. Vergara 3263", telefono: "4665-5754" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "WILLIAM MORRIS", direccion: "Potosí y Villegas 3248", telefono: "4452-0512" },
  ],
  H: [
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "ANGIOLINI", direccion: "Poeta Risso 3306", telefono: "4665-6108" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "NUEVA CASELLA", direccion: "Julio A. Roca 1016", telefono: "4452-0815" },
    { ciudad_slug: "hurlingham", fecha_turno: "", nombre_farmacia: "VAZQUEZ", direccion: "Granaderos 505", telefono: "7395-3762" },
  ],
}

const LETRAS = ["A", "B", "C", "D", "E", "F", "G", "H"]

export function predecirGrupoHurlingham(fechaYYYYMMDD: string): string {
  const [y1, m1, d1] = FECHA_REFERENCIA.split("-").map(Number)
  const [y2, m2, d2] = fechaYYYYMMDD.split("-").map(Number)
  const ref = Date.UTC(y1, m1 - 1, d1)
  const objetivo = Date.UTC(y2, m2 - 1, d2)
  const diffDias = Math.round((objetivo - ref) / 86_400_000)
  const idx = ((diffDias % 8) + 8) % 8
  return LETRAS[idx]
}

export class HurlinghamScraper implements ICityScraper {
  readonly ciudad_slug = "hurlingham"
  readonly scraper_key = "central_oeste_calendario"

  async scrape(fechaAR?: string): Promise<ScraperResult> {
    const fecha = fechaAR ?? hoyArgentinaYYYYMMDD()
    const grupo = predecirGrupoHurlingham(fecha)
    logger.info(`[hurlingham] Grupo calculado para ${fecha}: ${grupo}`)

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

export const hurlinghamScraper = new HurlinghamScraper()
