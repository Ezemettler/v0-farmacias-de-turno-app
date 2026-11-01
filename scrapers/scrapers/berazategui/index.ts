import * as cheerio from "cheerio"
import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// berazategui.gob.ar (sitio municipal) — HTML en vivo con las farmacias
// de turno AHORA para todo el partido de Berazategui (incluye
// localidades como Plátanos y Hudson cuando hay alguna de turno ese
// día). El sitio se rediseñó entre octubre y noviembre 2026
// (confirmado a mano el 01/11, rompió el parser viejo basado en
// .farma/.texto1/.texto2/.texto3) — ahora cada farmacia es un
// <article class="tarjeta">: <h2 class="tarjeta-nombre"> para el
// nombre, y dentro de .tarjeta-cuerpo varios div.dato: el de la
// dirección trae un <span class="localidad"> adentro (el resto del
// texto del div, antes del <br>, es la dirección), el del teléfono
// trae un <span class="dato-etiqueta">Teléfono:</span> seguido del
// número como texto suelto en el mismo div.
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

    $(".tarjeta").each((_, card) => {
      const $card = $(card)
      const nombre = $card.find(".tarjeta-nombre").first().text().trim()

      let direccion = ""
      let localidadTexto = ""
      let telefono: string | undefined

      $card.find(".dato").each((_, datoEl) => {
        const $dato = $(datoEl)
        const $localidad = $dato.find(".localidad")

        if ($localidad.length > 0) {
          localidadTexto = $localidad.first().text().trim()
          direccion = $dato
            .find("> div")
            .first()
            .clone()
            .find(".localidad")
            .remove()
            .end()
            .text()
            .trim()
          return
        }

        const etiqueta = $dato.find(".dato-etiqueta").first().text().trim()
        if (/^tel[eé]fono:?$/i.test(etiqueta)) {
          const crudo = $dato
            .find("> div")
            .first()
            .clone()
            .find(".dato-etiqueta")
            .remove()
            .end()
            .text()
            .trim()
          // "-" y "S/E" (sin especificar) significan que no hay teléfono cargado.
          telefono = crudo && !["-", "s/e"].includes(crudo.toLowerCase()) ? crudo : undefined
        }
      })

      if (localidadTexto.toLowerCase() !== this.localidad.toLowerCase()) return
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
