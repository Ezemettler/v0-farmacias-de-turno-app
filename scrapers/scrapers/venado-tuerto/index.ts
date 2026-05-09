import * as cheerio from "cheerio"
import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, parseARDateTimeToISO } from "../../lib/fecha.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// Colegio de Farmacéuticos de la Provincia de Santa Fe — Delegación Sur
// TODO: Verificar URL real con `curl` y adaptar selectores
const SOURCE_URL = "https://www.cofarsf.org.ar/turnos"

export class VenadoTuertoScraper extends BaseScraper {
  readonly ciudad_slug = "venado-tuerto"
  readonly scraper_key = "colegio_santafe_sur"
  protected readonly url = SOURCE_URL

  protected async scrapeHtml(html: string, fecha: string): Promise<ScraperResult> {
    const $ = cheerio.load(html)
    const rows: ScrapedTurno[] = []

    // TODO: Adaptar selectores al HTML real del sitio de COFARSF
    $("table tr, .farmacia-turno, .turno-item").each((_, el) => {
      const cells = $(el).find("td")
      if (cells.length < 3) return

      const nombre = $(cells[0]).text().trim()
      const direccion = $(cells[1]).text().trim()
      const telefono = $(cells[2]).text().trim() || undefined
      const rawInicio = $(cells[3]).text().trim()
      const rawFin = $(cells[4]).text().trim()

      if (!nombre || !direccion) return

      rows.push({
        ciudad_slug: this.ciudad_slug,
        fecha_turno: fecha,
        nombre_farmacia: nombre,
        direccion,
        telefono,
        inicio_turno: parseARDateTimeToISO(rawInicio) ?? parseARTimeToISO(fecha, rawInicio),
        fin_turno: parseARDateTimeToISO(rawFin) ?? parseARTimeToISO(fecha, rawFin),
      })
    })

    return {
      ciudad_slug: this.ciudad_slug,
      status: rows.length > 0 ? "success" : "no_data",
      rows,
      source_url: this.url,
    }
  }
}

export const venadoTuertoScraper = new VenadoTuertoScraper()
