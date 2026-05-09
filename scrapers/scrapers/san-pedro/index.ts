import type { ICityScraper, ScraperResult } from "../../lib/types.js"
import { ManualFallbackError } from "../../lib/types.js"
import { hoyArgentinaYYYYMMDD } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"

// San Pedro (Buenos Aires) — sin fuente oficial scrapeable identificada.
// Verificar si el Colegio de Farmacéuticos Zona Norte BA (cofaba.org.ar)
// lista San Pedro junto con San Nicolás. Si es así, reemplazar este stub
// por una instancia de ColegioBANorteScraper de san-nicolas/index.ts.
export class SanPedroScraper implements ICityScraper {
  readonly ciudad_slug = "san-pedro"
  readonly scraper_key = "stub_manual"

  async scrape(_fechaAR?: string): Promise<ScraperResult> {
    const fecha = _fechaAR ?? hoyArgentinaYYYYMMDD()
    const error = new ManualFallbackError("San Pedro")
    logger.warn(`[san-pedro] ${error.message}`)
    return {
      ciudad_slug: this.ciudad_slug,
      status: "no_data",
      rows: [],
      source_url: "",
      error,
    }
  }
}

export const sanPedroScraper = new SanPedroScraper()
