import * as cheerio from "cheerio"
import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// infopico.com — HTML estático con Bootstrap tabs por día del mes.
// Tab ID: #farmacias{DD} (ej. #farmacias09 para el día 9).
// Cada card usa schema.org: itemprop="name", "address", "telephone".
// Plugin: weedo-pharmacy-card.

class InfoPicoScraper extends BaseScraper {
  readonly ciudad_slug: string
  readonly scraper_key = "infopico_weedo"
  protected readonly url: string

  constructor(ciudadSlug: "santa-rosa" | "general-pico", url: string) {
    super()
    this.ciudad_slug = ciudadSlug
    this.url = url
  }

  protected async scrapeHtml(html: string, fecha: string): Promise<ScraperResult> {
    const $ = cheerio.load(html)
    const diaHoy = parseInt(fecha.split("-")[2], 10)
    const tabId = `#farmacias${String(diaHoy).padStart(2, "0")}`

    const tab = $(tabId)
    if (!tab.length) {
      logger.warn(`[${this.ciudad_slug}] Tab ${tabId} no encontrada. Tabs disponibles:`)
      $("[id^='farmacias']").each((_, el) => logger.warn(`  #${$(el).attr("id")}`))
      return { ciudad_slug: this.ciudad_slug, status: "no_data", rows: [], source_url: this.url }
    }

    const rows: ScrapedTurno[] = []

    tab.find(".weedo-pharmacy-card").each((_, card) => {
      const nombre = $(card).find("[itemprop='name']").text().trim()
      const direccion = $(card).find("[itemprop='address']").text().trim()
      const telefono = $(card).find("[itemprop='telephone']").text().trim() || undefined

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

    logger.info(`[${this.ciudad_slug}] Tab ${tabId}: ${rows.length} farmacias`)
    return {
      ciudad_slug: this.ciudad_slug,
      status: rows.length > 0 ? "success" : "no_data",
      rows,
      source_url: this.url,
    }
  }
}

export const santaRosaScraper = new InfoPicoScraper(
  "santa-rosa",
  "https://www.infopico.com/farmacias-de-turno-en-santa-rosa/"
)

// TODO: confirmar URL real para General Pico en infopico.com
// Candidatos: /farmacias-de-turno-en-general-pico/ o /farmacias-de-turno-general-pico/
export const generalPicoScraper = new InfoPicoScraper(
  "general-pico",
  "https://www.infopico.com/farmacias-de-turno-en-general-pico/"
)
