import * as cheerio from "cheerio"
import { BaseScraper } from "../base-scraper.js"
import { parseARTimeToISO } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ScrapedTurno, ScraperResult } from "../../lib/types.js"

// colfarmasanfdo.org.ar — calendario mensual HTML estático.
// Estructura: filas alternadas <tr class="fecha"> con "DíaNombre N:" y
// <tr> de datos con las farmacias en la celda de la columna correspondiente.
// Horario fijo: 08:30 del día indicado → 08:30 del día siguiente.
const SOURCE_URL = "https://colfarmasanfdo.org.ar/turnero.html"

export class SanFernandoScraper extends BaseScraper {
  readonly ciudad_slug = "san-fernando"
  readonly scraper_key = "colegio_san_fernando"
  protected readonly url = SOURCE_URL

  protected async scrapeHtml(html: string, fecha: string): Promise<ScraperResult> {
    const $ = cheerio.load(html)
    const [yearStr, monthStr, dayStr] = fecha.split("-")
    const diaHoy = parseInt(dayStr, 10)
    const mesHoy = parseInt(monthStr, 10)
    const anioHoy = parseInt(yearStr, 10)

    // Verificar que la tabla corresponde al mes actual
    const tableYear = parseInt($("table.turnero-table").attr("data-turnero-cal-year") ?? "0", 10)
    const tableMonth = parseInt($("table.turnero-table").attr("data-turnero-cal-month") ?? "0", 10)
    if (tableYear !== anioHoy || tableMonth !== mesHoy) {
      // El calendario es del mes pasado/próximo — puede pasar a principio de mes
      // mientras no actualizan. Igualmente intentamos buscar la fecha.
      logger.warn(`[san-fernando] Tabla es ${tableMonth}/${tableYear}, hoy es ${mesHoy}/${anioHoy}`)
    }

    // Buscar la celda de farmacias para hoy
    const celda = this.encontrarCeldaDelDia($, diaHoy, mesHoy, anioHoy)
    if (!celda) {
      logger.warn(`[san-fernando] No se encontró celda para el día ${diaHoy}/${mesHoy}/${anioHoy}`)
      logger.warn(`[san-fernando] Fechas disponibles en la tabla:`)
      $("tr.fecha td").each((_, td) => logger.warn(`  "${$(td).text().trim()}"`))
      return { ciudad_slug: this.ciudad_slug, status: "no_data", rows: [], source_url: this.url }
    }

    const mañana = siguienteDia(fecha)
    const rows = this.parsearCelda($, celda, fecha, mañana)
    logger.info(`[san-fernando] Día ${diaHoy}: ${rows.length} farmacias`)

    return {
      ciudad_slug: this.ciudad_slug,
      status: rows.length > 0 ? "success" : "no_data",
      rows,
      source_url: this.url,
    }
  }

  // ── Encuentra la <td> de farmacias que corresponde al día pedido ─────────────
  //
  // La tabla alterna dos tipos de fila:
  //   <tr class="fecha"><td>Sábado 9:</td><td>Domingo 10:</td></tr>
  //   <tr><td>farmacias col 0</td><td>farmacias col 1</td></tr>
  //
  // Formato normal:     "Sábado 9:"          → matchea /(\d{1,2}):$/
  // Formato fin de mes: "Lunes 01/06/2026:"  → matchea /(\d{2})\/(\d{2})\/(\d{4}):$/

  private encontrarCeldaDelDia(
    $: cheerio.CheerioAPI,
    dia: number,
    mes: number,
    anio: number
  ): cheerio.Element | null {
    let resultado: cheerio.Element | null = null

    $("tr.fecha").each((_, fechaRow) => {
      if (resultado) return false // break

      $(fechaRow)
        .find("td")
        .each((colIdx, fechaTd) => {
          const texto = $(fechaTd).text().trim()

          // Caso normal: "Viernes 1:", "Sábado 9:", "Domingo 31:"
          const mNormal = texto.match(/^[^\d]+(\d{1,2}):$/)
          if (mNormal && parseInt(mNormal[1], 10) === dia) {
            resultado = $(fechaRow).next("tr").find("td").get(colIdx) ?? null
            return false // break inner
          }

          // Caso fin de mes: "Lunes 01/06/2026:"
          const mCross = texto.match(/^[^\d]+(\d{2})\/(\d{2})\/(\d{4}):$/)
          if (mCross) {
            const d = parseInt(mCross[1], 10)
            const m = parseInt(mCross[2], 10)
            const y = parseInt(mCross[3], 10)
            if (d === dia && m === mes && y === anio) {
              resultado = $(fechaRow).next("tr").find("td").get(colIdx) ?? null
              return false
            }
          }
        })
    })

    return resultado
  }

  // ── Parsea las farmacias de la celda ─────────────────────────────────────────
  //
  // Cada línea tiene formato "Nombre: Dirección".
  // Horario fijo según la nota del sitio: 08:30 día → 08:30 día siguiente.

  private parsearCelda(
    $: cheerio.CheerioAPI,
    celda: cheerio.Element,
    fecha: string,
    fechaMañana: string
  ): ScrapedTurno[] {
    const htmlCelda = $(celda).html() ?? ""
    const conSaltos = htmlCelda.replace(/<br\s*\/?>/gi, "\n")
    const texto = cheerio.load(conSaltos).text()

    const rows: ScrapedTurno[] = []

    for (const linea of texto.split("\n")) {
      const l = linea.trim()
      if (!l) continue

      const sep = l.indexOf(":")
      if (sep === -1) continue

      const nombre = l.slice(0, sep).trim()
      const direccion = l.slice(sep + 1).trim()
      if (!nombre || !direccion) continue

      rows.push({
        ciudad_slug: this.ciudad_slug,
        fecha_turno: fecha,
        nombre_farmacia: nombre,
        direccion,
        inicio_turno: parseARTimeToISO(fecha, "08:30"),
        fin_turno: parseARTimeToISO(fechaMañana, "08:30"),
      })
    }

    return rows
  }
}

// ── Helper: día siguiente en YYYY-MM-DD ──────────────────────────────────────

function siguienteDia(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  return next.toISOString().slice(0, 10)
}

export const sanFernandoScraper = new SanFernandoScraper()
