import { hoyArgentinaYYYYMMDD, parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ICityScraper, ScrapedTurno, ScraperResult } from "../../lib/types.js"

// Haedo, Buenos Aires — mismo sistema que Morón/Castelar (ver
// scrapers/scrapers/moron/index.ts), acá con 9 grupos (A-I). Confirmado a
// mano contra los calendarios oficiales de septiembre y octubre 2026 (61
// días, cero excepciones): ciclo de 9 días, avanza una letra por día
// calendario. A diferencia de Morón/Castelar, ningún grupo comparte una
// farmacia fija en común (sin equivalente a CRAVENNA/NIJUL). Se extiende
// el ciclo hacia el futuro sin esperar confirmación mensual, mismo
// criterio ya acordado para Morón y Castelar.
const FECHA_REFERENCIA = "2026-09-01" // confirmado a mano: Grupo A

const GRUPOS: Record<string, ScrapedTurno[]> = {
  A: [
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "DI ROSA", direccion: "Bergamini 1608", telefono: "4758-0489" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "LAS BASES", direccion: "Las Bases 131", telefono: "4659-3039" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "RUSCELLI", direccion: "Presidente Perón 1574", telefono: "4443-4520" },
  ],
  B: [
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "ALFA FARMA", direccion: "Victorica 496", telefono: "4751-4654" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "HAEDO", direccion: "Caseros 2", telefono: "4460-1444" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "MINELLA S.C.S.", direccion: "Av. Rosales 1714", telefono: "4443-1276" },
  ],
  C: [
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "CALABRO", direccion: "Carlos Bunge 1002", telefono: "4758-1482" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "MARCONI 1986", direccion: "Marconi 1986", telefono: "5434-6943" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "CENTRAL", direccion: "Av. Rivadavia 16031", telefono: "4659-1321" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "GÜEMES DE HAEDO S.C.S.", direccion: "Av. Luis Güemes 103", telefono: "4443-9974" },
  ],
  D: [
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "BARTOLOTTA", direccion: "Marconi 401", telefono: "2201-1695" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "MANGIANTE1986", direccion: "José Bianco 1423", telefono: "4659-3910" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "ADDUCCHIO", direccion: "Suipacha 1201", telefono: "4443-7806" },
  ],
  E: [
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "KOCH", direccion: "Perdriel 1647", telefono: "4758-6262" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "CONSTITUCIÓN", direccion: "Constitución 699", telefono: "4659-5171" },
  ],
  F: [
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "ISAN S.C.S.", direccion: "Av. Don Bosco 337", telefono: "4659-8949" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "MOPELLA", direccion: "Presidente Perón 1953", telefono: "4659-3209" },
  ],
  G: [
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "VARRELLA", direccion: "Jose Bianco 2591", telefono: "5290-4802" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "CARRILES", direccion: "Marconi 1700", telefono: "4751-9068" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "ALGOZI", direccion: "Pueyrredon 1399", telefono: "5648-4515" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "FARMA GO", direccion: "Juan B. Justo 537", telefono: "4443-3646" },
  ],
  H: [
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "BLANCO", direccion: "Rosales 736", telefono: "4751-1220" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "ALMIRON", direccion: "Av. Don Bosco 1849", telefono: "4650-1527" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "GUELBERT", direccion: "Defensa 284", telefono: "4443-2696" },
  ],
  I: [
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "ERLIJ", direccion: "Ferrari 14", telefono: "4751-2188" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "CESIO", direccion: "Av. Rivadavia 16241", telefono: "4659-1041" },
    { ciudad_slug: "haedo", fecha_turno: "", nombre_farmacia: "LOPEZ", direccion: "Rafael Amato 1399", telefono: "4650-8352" },
  ],
}

const LETRAS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]

export function predecirGrupoHaedo(fechaYYYYMMDD: string): string {
  const [y1, m1, d1] = FECHA_REFERENCIA.split("-").map(Number)
  const [y2, m2, d2] = fechaYYYYMMDD.split("-").map(Number)
  const ref = Date.UTC(y1, m1 - 1, d1)
  const objetivo = Date.UTC(y2, m2 - 1, d2)
  const diffDias = Math.round((objetivo - ref) / 86_400_000)
  const idx = ((diffDias % 9) + 9) % 9
  return LETRAS[idx]
}

export class HaedoScraper implements ICityScraper {
  readonly ciudad_slug = "haedo"
  readonly scraper_key = "central_oeste_calendario"

  async scrape(fechaAR?: string): Promise<ScraperResult> {
    const fecha = fechaAR ?? hoyArgentinaYYYYMMDD()
    const grupo = predecirGrupoHaedo(fecha)
    logger.info(`[haedo] Grupo calculado para ${fecha}: ${grupo}`)

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

export const haedoScraper = new HaedoScraper()
