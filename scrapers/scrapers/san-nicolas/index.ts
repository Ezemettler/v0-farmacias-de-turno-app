import * as cheerio from "cheerio"
import { hoyArgentinaYYYYMMDD, parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ICityScraper, ScrapedTurno, ScraperResult } from "../../lib/types.js"
import { predecirLetraTurnoSanNicolas } from "../../lib/prediccion-san-nicolas.js"
import { ROSTER_SAN_NICOLAS } from "../../lib/roster-san-nicolas.js"
import { sendTelegramAlert } from "../../lib/telegram.js"

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
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "es-AR,es;q=0.9",
        },
        signal: AbortSignal.timeout(30_000),
      })

      if (!res.ok) {
        logger.warn(`[san-nicolas] HTTP ${res.status} — ${url} — uso predicción del ciclo`)
        return await this.usarPrediccion(fecha, `HTTP ${res.status}`)
      }

      html = await res.text()
    } catch (err) {
      logger.warn(`[san-nicolas] Error de red — uso predicción del ciclo:`, err)
      return await this.usarPrediccion(fecha, err instanceof Error ? err.message : String(err))
    }

    const rows = this.parse(html, fecha, url)

    if (rows.length === 0) {
      logger.warn(`[san-nicolas] Sin farmacias en el HTML — uso predicción del ciclo: ${url}`)
      return await this.usarPrediccion(fecha, "HTML sin farmacias parseables")
    }

    logger.info(`[san-nicolas] ${rows.length} farmacias encontradas`)
    return {
      ciudad_slug: this.ciudad_slug,
      status: "success",
      rows,
      source_url: url,
    }
  }

  // Respaldo automático cuando diarioelnorte.com.ar falla (típicamente
  // bloqueo 403 de Cloudflare contra IPs de la nube). El ciclo de 12
  // días (A→B→...→L→A) viene coincidiendo con la fuente real en todas
  // las confirmaciones manuales hechas hasta ahora — a pedido del
  // usuario, se carga directo en vez de esperar confirmación por
  // Telegram. Sigue habilitada la corrección manual por el bot si
  // alguna vez la predicción se desvía (ver telegram-bot/lib/
  // turnos-san-nicolas.ts).
  private async usarPrediccion(fecha: string, motivoFalloReal: string): Promise<ScraperResult> {
    const grupo = predecirLetraTurnoSanNicolas(fecha)
    const inicio_turno = parseARTimeToISO(fecha, "08:30")
    const fin_turno = parseARTimeToISO(siguienteDia(fecha), "08:30")

    const rows: ScrapedTurno[] = ROSTER_SAN_NICOLAS[grupo].map((f) => ({
      ciudad_slug: this.ciudad_slug,
      fecha_turno: fecha,
      nombre_farmacia: f.nombre,
      direccion: f.direccion,
      inicio_turno,
      fin_turno,
    }))

    logger.info(`[san-nicolas] Predicción del ciclo: Turno ${grupo} (${rows.length} farmacias)`)

    await sendTelegramAlert(
      `📋 <b>San Nicolás — turno cargado por predicción</b>\n` +
        `La fuente real falló (${motivoFalloReal}), se cargó el <b>Turno ${grupo}</b> según el ciclo de 12 días.\n` +
        `Si no coincide con el cartel real, corregilo mandándome la letra correcta por acá.`
    )

    return {
      ciudad_slug: this.ciudad_slug,
      status: "success",
      rows,
      source_url: `predicción del ciclo (Turno ${grupo}) — fuente real falló: ${motivoFalloReal}`,
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
        inicio_turno: parseARTimeToISO(fecha, "08:30"),
        fin_turno: parseARTimeToISO(siguienteDia(fecha), "08:30"),
      })
    })

    return rows
  }
}

export const sanNicolasScraper = new SanNicolasScraper()
