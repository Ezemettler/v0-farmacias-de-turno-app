import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// afsp.ar (Asociación Farmacéutica de San Pedro) — la home carga los
// turnos vía un componente Vue que pega contra este endpoint JSON. Trae
// día anterior/actual/siguiente en una sola llamada (campo tipo_dia),
// filtramos por fecha exacta en vez de confiar en ese campo. El propio
// componente indica el horario: "desde las 8:30 Hs. del dia que figura
// en la planilla hasta las 8:30 del dia siguiente" (mismo estándar del
// resto del sitio).
const URL = "https://afsp.ar/metodos/farmacias.php?oper=turnos_inicial"

interface RespuestaAFSP {
  id: number | null
  farmacia: string
  fecha: string // "YYYY-MM-DD"
  telefono: string
  direccion: string
  tipo_dia: string
}

class SanPedroScraper extends BaseScraper {
  readonly ciudad_slug = "san-pedro"
  readonly scraper_key = "afsp"
  protected readonly url = URL

  protected async scrapeHtml(json: string, fecha: string): Promise<ScraperResult> {
    const entradas: RespuestaAFSP[] = JSON.parse(json)

    const rows: ScrapedTurno[] = entradas
      .filter((e) => e.fecha === fecha)
      .map((e) => ({
        ciudad_slug: this.ciudad_slug,
        fecha_turno: fecha,
        nombre_farmacia: e.farmacia,
        direccion: e.direccion,
        telefono: e.telefono || undefined,
        inicio_turno: parseARTimeToISO(fecha, "08:30"),
        fin_turno: parseARTimeToISO(siguienteDia(fecha), "08:30"),
      }))

    return {
      ciudad_slug: this.ciudad_slug,
      status: rows.length > 0 ? "success" : "no_data",
      rows,
      source_url: this.url,
    }
  }
}

export const sanPedroScraper = new SanPedroScraper()
