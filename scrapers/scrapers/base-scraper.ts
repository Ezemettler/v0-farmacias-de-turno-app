import type { ICityScraper, ScraperResult } from "../lib/types.js"
import { hoyArgentinaYYYYMMDD } from "../lib/fecha.js"
import { logger } from "../lib/logger.js"

export abstract class BaseScraper implements ICityScraper {
  abstract readonly ciudad_slug: string
  abstract readonly scraper_key: string
  protected abstract readonly url: string
  // La mayoría de las fuentes sirven UTF-8. Algunas (ej. El Litoral)
  // declaran ISO-8859-1 en el Content-Type — .text() del fetch nativo
  // siempre decodifica como UTF-8 sin importar el charset declarado, así
  // que hay que decodificar a mano en esos casos.
  protected readonly encoding: string = "utf-8"

  protected abstract scrapeHtml(html: string, fecha: string): Promise<ScraperResult>

  async scrape(fechaAR?: string): Promise<ScraperResult> {
    const fecha = fechaAR ?? hoyArgentinaYYYYMMDD()
    const start = Date.now()

    logger.info(`[${this.ciudad_slug}] Iniciando fetch → ${this.url}`)

    let html: string
    try {
      const res = await fetch(this.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-AR,es;q=0.9",
        },
        signal: AbortSignal.timeout(30_000),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }

      if (this.encoding.toLowerCase() === "utf-8") {
        html = await res.text()
      } else {
        const buffer = await res.arrayBuffer()
        html = new TextDecoder(this.encoding).decode(buffer)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(`[${this.ciudad_slug}] Fetch fallido: ${err.message}`)
      return {
        ciudad_slug: this.ciudad_slug,
        status: "failed",
        rows: [],
        source_url: this.url,
        error: err,
      }
    }

    try {
      const result = await this.scrapeHtml(html, fecha)
      const elapsed = Date.now() - start
      logger.info(
        `[${this.ciudad_slug}] ${result.status.toUpperCase()} — ${result.rows.length} turnos en ${elapsed}ms`
      )
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(`[${this.ciudad_slug}] Parse fallido: ${err.message}`)
      return {
        ciudad_slug: this.ciudad_slug,
        status: "failed",
        rows: [],
        source_url: this.url,
        error: err,
      }
    }
  }
}
