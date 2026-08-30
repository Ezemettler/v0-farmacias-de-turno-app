import * as cheerio from "cheerio"
import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// colfarmalp.org.ar/turnos-la-plata/ — HTML en vivo con las farmacias
// que están de turno AHORA (no un calendario mensual). Cada fila es un
// .turnos .tr con celdas .td etiquetadas por un <span>: Farmacia,
// Dirección, Zona, Teléfono. La Zona puede ser "La Plata", "Los Hornos"
// o "Norte". "Norte" se fusiona con "La Plata" (Zona Norte de La Plata
// se confunde con Zona Norte del GBA, así que no tiene página propia).
const URL = "https://www.colfarmalp.org.ar/turnos-la-plata/"

function campoSinEtiqueta($td: cheerio.Cheerio<any>): string {
  return $td.clone().find("span").remove().end().text().trim()
}

class ColfarmalpScraper extends BaseScraper {
  readonly ciudad_slug: string
  readonly scraper_key = "colfarmalp"
  protected readonly url = URL
  private readonly zonas: string[]

  constructor(ciudadSlug: "la-plata" | "los-hornos", zonas: string[]) {
    super()
    this.ciudad_slug = ciudadSlug
    this.zonas = zonas
  }

  protected async scrapeHtml(html: string, fecha: string): Promise<ScraperResult> {
    const $ = cheerio.load(html)
    const rows: ScrapedTurno[] = []

    $(".turnos .tr").each((_, tr) => {
      const tds = $(tr).find(".td")
      if (tds.length < 4) return // fila de header u otra cosa

      const nombre = campoSinEtiqueta(tds.eq(0))
      const direccion = campoSinEtiqueta(tds.eq(1))
      const zona = campoSinEtiqueta(tds.eq(2))
      const telefono = campoSinEtiqueta(tds.eq(3)) || undefined

      if (!this.zonas.includes(zona)) return
      if (!nombre || !direccion) return

      rows.push({
        ciudad_slug: this.ciudad_slug,
        fecha_turno: fecha,
        nombre_farmacia: nombre,
        direccion,
        telefono,
        inicio_turno: parseARTimeToISO(fecha, "08:30"),
        fin_turno: parseARTimeToISO(siguienteDia(fecha), "08:30"),
      })
    })

    logger.info(`[${this.ciudad_slug}] ${rows.length} farmacias (zonas: ${this.zonas.join(", ")})`)
    return {
      ciudad_slug: this.ciudad_slug,
      status: rows.length > 0 ? "success" : "no_data",
      rows,
      source_url: this.url,
    }
  }
}

export const laPlataScraper = new ColfarmalpScraper("la-plata", ["La Plata", "Norte"])
export const losHornosScraper = new ColfarmalpScraper("los-hornos", ["Los Hornos"])
