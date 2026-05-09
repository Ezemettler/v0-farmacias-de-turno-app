import * as cheerio from "cheerio"
import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, parseARDateTimeToISO } from "../../lib/fecha.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// Colegio de Farmacéuticos de la Provincia de Buenos Aires — Delegación Zona Norte
// Cubre San Nicolás, San Pedro y posiblemente San Fernando.
// TODO: Verificar URL real y adaptar selectores con `curl`
const SOURCE_URL = "https://www.cofaba.org.ar/farmacias-de-turno"

class ColegioBANorteScraper extends BaseScraper {
  readonly ciudad_slug: string
  readonly scraper_key = "colegio_ba_norte"
  protected readonly url = SOURCE_URL

  // nombreEnFuente: cómo aparece el nombre de la ciudad en el HTML fuente
  private readonly nombreEnFuente: string

  constructor(ciudadSlug: string, nombreEnFuente: string) {
    super()
    this.ciudad_slug = ciudadSlug
    this.nombreEnFuente = nombreEnFuente
  }

  protected async scrapeHtml(html: string, fecha: string): Promise<ScraperResult> {
    const $ = cheerio.load(html)
    const rows: ScrapedTurno[] = []

    // TODO: Inspeccionar el HTML real y adaptar selectores.
    // Patrón alternativo: el sitio puede tener filtro por delegación en la URL.
    // En ese caso, cambiar SOURCE_URL a incluir el parámetro de ciudad.
    $("table tr, .turno, .farmacia, tr.farmacia-row").each((_, el) => {
      const cells = $(el).find("td")
      if (cells.length < 3) return

      const ciudad = $(cells[0]).text().trim()
      const nombre = $(cells[1]).text().trim()
      const direccion = $(cells[2]).text().trim()
      const telefono = $(cells[3]).text().trim() || undefined
      const rawInicio = $(cells[4]).text().trim()
      const rawFin = $(cells[5]).text().trim()

      if (!nombre || !direccion) return

      // Filtrar solo la ciudad que corresponde a esta instancia
      if (!ciudad.toLowerCase().includes(this.nombreEnFuente.toLowerCase())) return

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

export const sanNicolasScraper = new ColegioBANorteScraper("san-nicolas", "San Nicolás")
