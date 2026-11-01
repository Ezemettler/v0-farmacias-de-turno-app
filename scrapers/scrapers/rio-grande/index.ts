import * as cheerio from "cheerio"
import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// mitdf.com.ar/farmacias — portal de noticias de Tierra del Fuego. El
// sitio se rediseñó entre octubre y noviembre 2026 (confirmado a mano
// el 01/11, rompió el parser viejo basado en <span>/<p> sueltos) — ya
// no lista varias farmacias por ciudad en el HTML visible, pero sigue
// publicando un bloque <script type="application/ld+json"> con
// "@graph" que incluye una entidad schema.org Pharmacy por ciudad
// (name, telephone, address.streetAddress, address.addressLocality) —
// mucho más estable que parsear texto visible porque está pensado
// para ser leído por máquinas. El horario exacto de turno no está
// publicado; se usa el mismo default de 08:30 a 08:30 que el resto de
// las ciudades.
const URL = "https://www.mitdf.com.ar/farmacias"

interface PharmacyLd {
  "@type": string
  name?: string
  telephone?: string
  address?: {
    streetAddress?: string
    addressLocality?: string
  }
}

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

    $('script[type="application/ld+json"]').each((_, script) => {
      let data: unknown
      try {
        data = JSON.parse($(script).contents().text())
      } catch {
        return
      }

      const grafo = (data as { "@graph"?: unknown[] })["@graph"]
      if (!Array.isArray(grafo)) return

      for (const item of grafo as PharmacyLd[]) {
        if (item["@type"] !== "Pharmacy") continue
        if (item.address?.addressLocality !== this.ciudadFuente) continue

        const nombre = item.name?.trim()
        const direccion = item.address?.streetAddress?.trim()
        if (!nombre || !direccion) {
          logger.warn(`[${this.ciudad_slug}] "${nombre ?? "?"}" sin dirección publicada — se omite`)
          continue
        }

        rows.push({
          ciudad_slug: this.ciudad_slug,
          fecha_turno: fecha,
          nombre_farmacia: nombre,
          direccion,
          telefono: item.telephone?.trim() || undefined,
          inicio_turno: parseARTimeToISO(fecha, "08:30"),
          fin_turno: parseARTimeToISO(siguienteDia(fecha), "08:30"),
        })
      }
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

// Ushuaia se sacó de acá (ver scrapers/scrapers/ushuaia/index.ts): esta
// fuente nunca publicaba dirección para esa ciudad puntual, aunque sí
// para Río Grande.
export const rioGrandeScraper = new MiTDFScraper("rio-grande", "Río Grande")
