import * as cheerio from "cheerio"
import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// mitdf.com.ar/farmacias — portal de noticias de Tierra del Fuego, app
// Next.js con mucho marcado de Tailwind/SVG inline. Estructura por
// ciudad: un <span> con el nombre de la ciudad, seguido de <p> con el
// nombre de la farmacia (a veces con un número pegado atrás separado
// por " - /", ej. "VIA FRANCA - /2964-488051" — se recorta), otro <p>
// opcional con la dirección, y un <a href="tel:..."> opcional con el
// teléfono. No todas las entradas tienen dirección/teléfono — si falta
// la dirección se descarta esa fila (no se puede armar el link de Maps).
// El horario exacto de turno no está publicado en el sitio; se usa el
// mismo default de 08:30 a 08:30 que el resto de las ciudades.
const URL = "https://www.mitdf.com.ar/farmacias"

class MiTDFScraper extends BaseScraper {
  readonly ciudad_slug: string
  readonly scraper_key = "mitdf"
  protected readonly url = URL
  private readonly ciudadFuente: string

  constructor(ciudadSlug: "rio-grande" | "ushuaia", ciudadFuente: string) {
    super()
    this.ciudad_slug = ciudadSlug
    this.ciudadFuente = ciudadFuente
  }

  protected async scrapeHtml(html: string, fecha: string): Promise<ScraperResult> {
    const $ = cheerio.load(html)
    const rows: ScrapedTurno[] = []

    $("span").each((_, span) => {
      const $span = $(span)
      if ($span.text().trim() !== this.ciudadFuente) return

      // Estructura: span (ciudad) → padre = fila de encabezado → abuelo
      // = bloque de la tarjeta, que también contiene los <p> y el <a>.
      const $bloque = $span.parent().parent()

      const nombreRaw = $bloque.find("p").eq(0).text().trim()
      if (!nombreRaw) return
      const nombre = nombreRaw.replace(/\s*-\s*\/[\d\s-]+$/, "").trim()

      const direccion = $bloque.find("p").eq(1).text().trim()
      if (!direccion) {
        logger.warn(`[${this.ciudad_slug}] "${nombre}" sin dirección publicada — se omite`)
        return
      }

      const telefono = $bloque.find("a[href^='tel:']").first().text().trim() || undefined

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

    logger.info(`[${this.ciudad_slug}] ${rows.length} farmacias`)
    return {
      ciudad_slug: this.ciudad_slug,
      status: rows.length > 0 ? "success" : "no_data",
      rows,
      source_url: this.url,
    }
  }
}

export const rioGrandeScraper = new MiTDFScraper("rio-grande", "Río Grande")
export const ushuaiaScraper = new MiTDFScraper("ushuaia", "Ushuaia")
