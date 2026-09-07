import { hoyArgentinaYYYYMMDD, parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ICityScraper, ScrapedTurno, ScraperResult } from "../../lib/types.js"

// Farmacias Central Oeste (cadena CRAVENNA) — Morón, Buenos Aires. No hay una
// URL para scrapear: el Colegio/cadena publica un cartel con 10 grupos fijos
// de farmacias (A-J) y un calendario mensual de qué grupo corresponde a cada
// día. Confirmado a mano contra los calendarios oficiales de septiembre y
// octubre 2026 (61 días, cero excepciones): la letra avanza un lugar por día
// calendario, sin relación con el día de la semana, en un ciclo de 10 días
// que arranca de nuevo en A después de J. A diferencia de San Nicolás (12
// letras, con una discontinuidad confirmada a fin de mes), acá el usuario
// pidió explícitamente extender el ciclo hacia el futuro sin esperar
// confirmación mes a mes, dado que la fuente lo publica con 2 meses de
// anticipación sin excepciones.
const FECHA_REFERENCIA = "2026-09-07" // confirmado a mano: Grupo A

const GRUPOS: Record<string, ScrapedTurno[]> = {
  A: [
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "GUERRA", direccion: "Rep. Oriental del Uruguay 265", telefono: "4629-3361" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CARLOS CASARES", direccion: "Av. Don Bosco 6201/05", telefono: "4697-0991" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CRAVENNA", direccion: "Av. Rivadavia 18199", telefono: "4483-4747" },
  ],
  B: [
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "DIAZ", direccion: "Pierrestegui 3483", telefono: "4697-0784" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CAMPOMOCCA S.C.S.", direccion: "Agüero 1426", telefono: "4696-3808" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CRAVENNA", direccion: "Av. Rivadavia 18199", telefono: "4483-4747" },
  ],
  C: [
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "GIUDICI", direccion: "J. J. Valle 810", telefono: "4627-4638" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "DIGIAMBATTISTA", direccion: "Burgos 981", telefono: "4696-8037" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CRAVENNA", direccion: "Av. Rivadavia 18199", telefono: "4483-4747" },
  ],
  D: [
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "IVITZ", direccion: "Eva Perón 2202", telefono: "4697-2917" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CRAVENNA", direccion: "Av. Rivadavia 18199", telefono: "4483-4747" },
  ],
  E: [
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CORES", direccion: "Hipólito Yrigoyen 1027", telefono: "4629-0676" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "TOSCANO", direccion: "Agüero 1807", telefono: "4696-5715" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CRAVENNA", direccion: "Av. Rivadavia 18199", telefono: "4483-4747" },
  ],
  F: [
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "TAGLIABUE", direccion: "Alessandri 896", telefono: "4696-7080" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CRAVENNA", direccion: "Av. Rivadavia 18199", telefono: "4483-4747" },
  ],
  G: [
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "LIMITE", direccion: "French 804", telefono: "4483-5187" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "PIERRESTEGUI", direccion: "Pierrestegui 1698", telefono: "4696-3529" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CRAVENNA", direccion: "Av. Rivadavia 18199", telefono: "4483-4747" },
  ],
  H: [
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "LA CANTABRICA DEL OESTE S.C.S.", direccion: "Dr. Ricardo Balbín 733", telefono: "4628-3949" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "NUEVA GRINES", direccion: "Agüero 998", telefono: "4696-3361" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "KATABIAN", direccion: "Av. Callao 1591" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CRAVENNA", direccion: "Av. Rivadavia 18199", telefono: "4483-4747" },
  ],
  I: [
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "COGLIATI FRENCH", direccion: "French 402", telefono: "4483-3304" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "AUTHIER", direccion: "Pierrestegui 2698", telefono: "4697-1483" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CRAVENNA", direccion: "Av. Rivadavia 18199", telefono: "4483-4747" },
  ],
  J: [
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CASTAGNA", direccion: "General Guido 718", telefono: "4489-3156" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "BIDEBERRY-CASTELLINI", direccion: "Patagones 1253", telefono: "4697-2782" },
    { ciudad_slug: "moron", fecha_turno: "", nombre_farmacia: "CRAVENNA", direccion: "Av. Rivadavia 18199", telefono: "4483-4747" },
  ],
}

const LETRAS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

export function predecirGrupoMoron(fechaYYYYMMDD: string): string {
  const [y1, m1, d1] = FECHA_REFERENCIA.split("-").map(Number)
  const [y2, m2, d2] = fechaYYYYMMDD.split("-").map(Number)
  const ref = Date.UTC(y1, m1 - 1, d1)
  const objetivo = Date.UTC(y2, m2 - 1, d2)
  const diffDias = Math.round((objetivo - ref) / 86_400_000)
  const idx = ((diffDias % 10) + 10) % 10
  return LETRAS[idx]
}

export class MoronScraper implements ICityScraper {
  readonly ciudad_slug = "moron"
  readonly scraper_key = "central_oeste_calendario"

  async scrape(fechaAR?: string): Promise<ScraperResult> {
    const fecha = fechaAR ?? hoyArgentinaYYYYMMDD()
    const grupo = predecirGrupoMoron(fecha)
    logger.info(`[moron] Grupo calculado para ${fecha}: ${grupo}`)

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

export const moronScraper = new MoronScraper()
