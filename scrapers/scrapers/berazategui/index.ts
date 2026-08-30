import * as cheerio from "cheerio"
import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// berazategui.gob.ar (sitio municipal) — HTML en vivo con las farmacias
// de turno AHORA para todo el partido de Berazategui (incluye
// localidades como Plátanos y Hudson). Cada farmacia es un div.farma
// con .texto1 (nombre), dos .texto2 (dirección y localidad entre
// paréntesis) y dos .texto3 ("Teléfono: X" / "Whatsapp: X").
const URL = "https://berazategui.gob.ar/farmacias_web/prueba.php"

class BerazateguiScraper extends BaseScraper {
  readonly ciudad_slug: string
  readonly scraper_key = "berazategui_muni"
  protected readonly url = URL
  private readonly localidad: string

  constructor(ciudadSlug: "berazategui" | "platanos" | "hudson", localidad: string) {
    super()
    this.ciudad_slug = ciudadSlug
    this.localidad = localidad
  }

  protected async scrapeHtml(html: string, fecha: string): Promise<ScraperResult> {
    const $ = cheerio.load(html)
    const rows: ScrapedTurno[] = []

    $(".farma").each((_, card) => {
      const $card = $(card)
      const nombre = $card.find(".texto1").first().text().trim()

      const textos2 = $card
        .find(".texto2")
        .map((_, t) => $(t).text().trim())
        .get()
      const direccion = textos2[0] ?? ""
      const localidadTexto = (textos2[1] ?? "").replace(/[()]/g, "").trim()

      if (localidadTexto.toLowerCase() !== this.localidad.toLowerCase()) return
      if (!nombre || !direccion) return

      const textos3 = $card
        .find(".texto3")
        .map((_, t) => $(t).text().trim())
        .get()
      const telefonoLinea = textos3.find((t) => /^tel[eé]fono/i.test(t))
      const telefonoCrudo = telefonoLinea?.replace(/^tel[eé]fono:\s*/i, "").trim()
      // "-" y "S/E" (sin especificar) significan que no hay teléfono cargado.
      const telefono =
        telefonoCrudo && !["-", "s/e"].includes(telefonoCrudo.toLowerCase()) ? telefonoCrudo : undefined

      rows.push({
        ciudad_slug: this.ciudad_slug,
        fecha_turno: fecha,
        nombre_farmacia: nombre,
        direccion,
        telefono: telefono && telefono !== "-" ? telefono : undefined,
        inicio_turno: parseARTimeToISO(fecha, "08:30"),
        fin_turno: parseARTimeToISO(siguienteDia(fecha), "08:30"),
      })
    })

    logger.info(`[${this.ciudad_slug}] ${rows.length} farmacias (localidad: ${this.localidad})`)
    return {
      ciudad_slug: this.ciudad_slug,
      status: rows.length > 0 ? "success" : "no_data",
      rows,
      source_url: this.url,
    }
  }
}

export const berazateguiScraper = new BerazateguiScraper("berazategui", "Berazategui")
export const platanosScraper = new BerazateguiScraper("platanos", "Plátanos")
export const hudsonScraper = new BerazateguiScraper("hudson", "Hudson")
