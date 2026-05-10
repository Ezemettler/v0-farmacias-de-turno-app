import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// informacionoficial.mendoza.gob.ar — PDFs mensuales de turno por ciudad.
// et_link_options_data es un array JSON en el HTML: [{class, url, target}, ...]
// San Rafael = elemento con class "et_pb_column_24".
//
// Formato del PDF (texto plano concatenado):
//   "1 ESPAÑA ALBERDI 16 HORAS 2 ZORRILLA MERCANTIL 16 HORAS ... 31 ... 16 HORAS"
// El número inicial de cada entrada es el día del mes.
const SOURCE_URL =
  "https://informacionoficial.mendoza.gob.ar/saludydeportes/farmacias-de-turno/"

interface EtLinkItem {
  class: string
  url: string
  target: string
}

export class SanRafaelScraper extends BaseScraper {
  readonly ciudad_slug = "san-rafael"
  readonly scraper_key = "mendoza_gob_pdf"
  protected readonly url = SOURCE_URL

  protected async scrapeHtml(html: string, fecha: string): Promise<ScraperResult> {
    const pdfUrl = this.extractPdfUrl(html)
    if (!pdfUrl) {
      logger.error("[san-rafael] No se encontró URL del PDF en et_link_options_data")
      return { ciudad_slug: this.ciudad_slug, status: "failed", rows: [], source_url: this.url }
    }
    logger.info(`[san-rafael] PDF: ${pdfUrl}`)

    const buffer = await this.downloadPdf(pdfUrl)
    if (!buffer) {
      return { ciudad_slug: this.ciudad_slug, status: "failed", rows: [], source_url: pdfUrl }
    }

    const text = await this.extractText(buffer)
    if (!text) {
      return { ciudad_slug: this.ciudad_slug, status: "failed", rows: [], source_url: pdfUrl }
    }

    const rows = this.parsePdf(text, fecha)

    if (rows.length === 0) {
      logger.warn("[san-rafael] Sin farmacias parseadas. Texto del PDF (primeros 500 chars):")
      logger.warn(text.slice(0, 500).replace(/\s+/g, " "))
    }

    return {
      ciudad_slug: this.ciudad_slug,
      status: rows.length > 0 ? "success" : "no_data",
      rows,
      source_url: pdfUrl,
    }
  }

  // ── Extrae la URL del PDF desde et_link_options_data ────────────────────────

  private extractPdfUrl(html: string): string | null {
    const match = html.match(/var\s+et_link_options_data\s*=\s*(\[[\s\S]*?\]);/)
    if (!match?.[1]) {
      logger.warn("[san-rafael] No se encontró et_link_options_data en el HTML")
      return null
    }

    let items: EtLinkItem[]
    try {
      items = JSON.parse(match[1]) as EtLinkItem[]
    } catch (err) {
      logger.error("[san-rafael] Error parseando et_link_options_data:", err)
      return null
    }

    const item = items.find((i) => i.class === "et_pb_column_24")
    if (!item) {
      logger.warn(
        `[san-rafael] et_pb_column_24 no encontrado. Clases: ${items.map((i) => i.class).join(", ")}`
      )
      return null
    }

    return item.url // JSON.parse decodifica \/ → / automáticamente
  }

  // ── Descarga el PDF ──────────────────────────────────────────────────────────

  private async downloadPdf(pdfUrl: string): Promise<Uint8Array | null> {
    try {
      const res = await fetch(pdfUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FarmaciasTurnoBot/1.0)" },
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) {
        logger.error(`[san-rafael] HTTP ${res.status} al descargar PDF`)
        return null
      }
      return new Uint8Array(await res.arrayBuffer())
    } catch (err) {
      logger.error("[san-rafael] Error de red al descargar PDF:", err)
      return null
    }
  }

  // ── Extrae texto del PDF con unpdf ──────────────────────────────────────────

  private async extractText(buffer: Uint8Array): Promise<string | null> {
    try {
      const { getDocumentProxy, extractText } = await import("unpdf")
      const pdf = await getDocumentProxy(buffer)
      const { text } = await extractText(pdf, { mergePages: true })
      return text
    } catch (err) {
      logger.error("[san-rafael] Error extrayendo texto del PDF:", err)
      return null
    }
  }

  // ── Parsea el texto del PDF y devuelve la farmacia del día de hoy ────────────
  //
  // Formato: "1 FARMACIA BARRIO 16 HORAS 2 FARMACIA BARRIO 16 HORAS ..."
  // Estrategia: dividir por "16 HORAS" → cada fragmento empieza con "{día} {info}"

  private parsePdf(text: string, fecha: string): ScrapedTurno[] {
    const diaHoy = parseInt(fecha.split("-")[2], 10)

    // Normalizar espacios del texto concatenado
    const textoNorm = text.replace(/\s+/g, " ").trim()

    // Dividir por el marcador de fin de cada entrada
    const fragmentos = textoNorm.split(/\b16\s+HORAS\b/i)

    for (const fragmento of fragmentos) {
      const limpio = fragmento.trim()
      if (!limpio) continue

      // Cada fragmento: "{número} {nombre farmacia} {barrio}"
      // El número puede estar precedido de texto residual del fragmento anterior
      // → buscar el último número al inicio de un "token" limpio
      const match = limpio.match(/(?:^|\s)(\d{1,2})\s+([A-ZÁÉÍÓÚÑ].+)$/i)
      if (!match) continue

      const numeroDia = parseInt(match[1], 10)
      if (numeroDia !== diaHoy) continue

      // Toda la info: "SAN RAFAEL 3 CIUDAD" — nombre + barrio juntos
      // No hay dirección de calle en este PDF; usamos el texto completo como nombre
      // y "San Rafael" como referencia de dirección
      const nombreCompleto = match[2].trim()

      logger.info(`[san-rafael] Día ${diaHoy}: ${nombreCompleto}`)

      return [
        {
          ciudad_slug: this.ciudad_slug,
          fecha_turno: fecha,
          nombre_farmacia: nombreCompleto,
          direccion: "San Rafael, Mendoza",
          inicio_turno: parseARTimeToISO(fecha, "08:30"),
          fin_turno: parseARTimeToISO(siguienteDia(fecha), "08:30"),
        },
      ]
    }

    // Fallback: si no se encontró con el split, buscar directamente con regex
    const reFallback = new RegExp(
      `\\b${diaHoy}\\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\\s0-9]+?)\\s+(?=\\d{1,2}\\s+[A-ZÁÉÍÓÚÑ]|16\\s+HORAS|$)`,
      "i"
    )
    const mFallback = textoNorm.match(reFallback)
    if (mFallback) {
      logger.info(`[san-rafael] Día ${diaHoy} (fallback): ${mFallback[1].trim()}`)
      return [
        {
          ciudad_slug: this.ciudad_slug,
          fecha_turno: fecha,
          nombre_farmacia: mFallback[1].trim(),
          direccion: "San Rafael, Mendoza",
          inicio_turno: parseARTimeToISO(fecha, "08:30"),
          fin_turno: parseARTimeToISO(siguienteDia(fecha), "08:30"),
        },
      ]
    }

    return []
  }
}

export const sanRafaelScraper = new SanRafaelScraper()
