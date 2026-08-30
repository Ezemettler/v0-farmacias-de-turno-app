import * as cheerio from "cheerio"
import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// servicios.ellitoral.com (diario El Litoral) — HTML en vivo, solo lista
// las farmacias que están "DE TURNO" ahora mismo (no hace falta filtrar
// por estado, todas las filas de la tabla ya son las vigentes). Cada
// farmacia es un div#contenedor.farmacias_hoy con #columna1 (nombre),
// #columna2 (dirección), #columna3 (teléfono). El turno es de 08:00 a
// 08:00 del día siguiente (distinto del 08:30 que usan otras ciudades,
// confirmado en el texto de la propia página).
class ElLitoralScraper extends BaseScraper {
  readonly ciudad_slug: string
  readonly scraper_key = "el_litoral"
  protected readonly url: string
  // El sitio declara ISO-8859-1 en el Content-Type (confirmado con curl -I).
  protected readonly encoding = "iso-8859-1"

  constructor(ciudadSlug: "santa-fe" | "santo-tome", url: string) {
    super()
    this.ciudad_slug = ciudadSlug
    this.url = url
  }

  protected async scrapeHtml(html: string, fecha: string): Promise<ScraperResult> {
    const $ = cheerio.load(html)
    const rows: ScrapedTurno[] = []

    $("#contenedor.farmacias_hoy").each((_, card) => {
      const $card = $(card)
      const nombre = $card.find("#columna1").text().trim()
      const direccion = $card.find("#columna2").text().trim()
      const telefono = $card.find("#columna3").text().trim() || undefined

      if (!nombre || !direccion) return

      rows.push({
        ciudad_slug: this.ciudad_slug,
        fecha_turno: fecha,
        nombre_farmacia: nombre,
        direccion,
        telefono,
        inicio_turno: parseARTimeToISO(fecha, "08:00"),
        fin_turno: parseARTimeToISO(siguienteDia(fecha), "08:00"),
      })
    })

    logger.info(`[${this.ciudad_slug}] ${rows.length} farmacias`)
    return {
      ciudad_slug: this.ciudad_slug,
      status: rows.length > 0 ? "success" : "no_data",
      rows,
      source_url: this.url,
    }
  }
}

export const santaFeScraper = new ElLitoralScraper(
  "santa-fe",
  "https://servicios.ellitoral.com/seccion/farmacias/"
)

export const santoTomeScraper = new ElLitoralScraper(
  "santo-tome",
  "https://servicios.ellitoral.com/seccion/farmacias-de-turno-santo-tome"
)
