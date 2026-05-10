import * as cheerio from "cheerio"
import { hoyArgentinaYYYYMMDD } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ICityScraper, ScrapedTurno, ScraperResult } from "../../lib/types.js"

// diarioelnorte.com.ar — artículo diario con la lista de farmacias de turno.
// URL: /farmacias-de-turno-en-san-nicolas-{diaSemana}-{día}-de-{mes}-de-{año}/
// Ejemplo: /farmacias-de-turno-en-san-nicolas-sabado-9-de-mayo-de-2026/
//
// Estructura HTML confirmada:
//   <p><strong>NOMBRE_FARMACIA</strong></p>
//   <p><a href="maps URL">Dirección</a></p>

const BASE_URL = "https://diarioelnorte.com.ar"

const DIAS_SEMANA = [
  "domingo", "lunes", "martes", "miercoles",
  "jueves", "viernes", "sabado",
]

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

function buildUrl(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number)
  // getUTCDay() es seguro porque fecha ya está en hora Argentina (YYYY-MM-DD)
  const diaSemana = DIAS_SEMANA[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  const mes = MESES[m - 1]
  return `${BASE_URL}/farmacias-de-turno-en-san-nicolas-${diaSemana}-${d}-de-${mes}-de-${y}/`
}

export class SanNicolasScraper implements ICityScraper {
  readonly ciudad_slug = "san-nicolas"
  readonly scraper_key = "diario_el_norte"

  async scrape(fechaAR?: string): Promise<ScraperResult> {
    const fecha = fechaAR ?? hoyArgentinaYYYYMMDD()
    const url = buildUrl(fecha)
    logger.info(`[san-nicolas] URL: ${url}`)

    let html: string
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "es-AR,es;q=0.9",
        },
        signal: AbortSignal.timeout(30_000),
      })

      if (!res.ok) {
        logger.error(`[san-nicolas] HTTP ${res.status} — ${url}`)
        return { ciudad_slug: this.ciudad_slug, status: "failed", rows: [], source_url: url }
      }

      html = await res.text()
    } catch (err) {
      logger.error(`[san-nicolas] Error de red:`, err)
      return { ciudad_slug: this.ciudad_slug, status: "failed", rows: [], source_url: url }
    }

    const rows = this.parse(html, fecha, url)

    if (rows.length === 0) {
      logger.warn(`[san-nicolas] Sin farmacias. Verificar URL: ${url}`)
    } else {
      logger.info(`[san-nicolas] ${rows.length} farmacias encontradas`)
    }

    return {
      ciudad_slug: this.ciudad_slug,
      status: rows.length > 0 ? "success" : "no_data",
      rows,
      source_url: url,
    }
  }

  private parse(html: string, fecha: string, url: string): ScrapedTurno[] {
    const $ = cheerio.load(html)
    const rows: ScrapedTurno[] = []

    // Iterar sobre cada <p><strong>NOMBRE</strong></p>
    // El siguiente <p> hermano contiene la dirección con un <a>
    $("p strong").each((_, strongEl) => {
      const $strong = $(strongEl)
      const $nombreP = $strong.parent("p")

      // Verificar que el <strong> sea el único contenido del <p>
      if ($nombreP.text().trim() !== $strong.text().trim()) return

      const nombre = $strong.text().trim()
      if (!nombre) return

      // Buscar el siguiente <p> no vacío
      let $next = $nombreP.next()
      while ($next.length && $next.is("p") && !$next.text().trim()) {
        $next = $next.next()
      }

      if (!$next.length || !$next.is("p")) return

      // La dirección puede estar en el texto del link o directamente en el párrafo
      const direccion =
        $next.find("a").first().text().trim() ||
        $next.text().trim()

      if (!direccion) return

      rows.push({
        ciudad_slug: this.ciudad_slug,
        fecha_turno: fecha,
        nombre_farmacia: nombre,
        direccion,
        // El artículo no expone horarios de inicio/fin
        inicio_turno: undefined,
        fin_turno: undefined,
      })
    })

    return rows
  }
}

export const sanNicolasScraper = new SanNicolasScraper()
