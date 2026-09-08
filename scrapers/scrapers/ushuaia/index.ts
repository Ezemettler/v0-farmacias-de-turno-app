import { parseARTimeToISO, siguienteDia, hoyArgentinaYYYYMMDD } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ICityScraper, ScrapedTurno, ScraperResult } from "../../lib/types.js"

// ushuaia.gob.ar/farmacias-de-turno combina dos fuentes públicas propias:
// 1) un Google Calendar donde cada evento de un día es la farmacia de
//    turno (campo "summary" = nombre, sin dirección ni teléfono).
// 2) un directorio en Directus (CMS) con domicilio/lat/lng fijos por
//    farmacia, matcheado contra el calendario por "nombre_en_api".
// Reemplaza al scraper anterior (mitdf.com.ar, compartido con Río
// Grande) que nunca traía dirección para Ushuaia — con esta fuente sí
// la tenemos. El aviso de la propia página aclara que acá el turno es
// de 9:00 a 9:00 del día siguiente (no 8:30 como el resto del sitio).
const CALENDAR_URL =
  "https://www.googleapis.com/calendar/v3/calendars/f98jsc0cotqr32jqmnku0o1ems@group.calendar.google.com/events"
const CALENDAR_API_KEY = "AIzaSyBiJVg36OaSgydCYdnvLBp-VKw-IPiisNo"
const DIRECTUS_URL = "https://adminportal.ushuaia.gob.ar/items/farmacias"

interface EventoCalendario {
  summary: string
  start: { date?: string }
}

interface FarmaciaDirectus {
  nombre_en_api: string | null
  domicilio: string
}

export class UshuaiaScraper implements ICityScraper {
  readonly ciudad_slug = "ushuaia"
  readonly scraper_key = "ushuaia_gob_calendario"

  async scrape(fechaAR?: string): Promise<ScraperResult> {
    const fecha = fechaAR ?? hoyArgentinaYYYYMMDD()
    const source_url = "https://www.ushuaia.gob.ar/farmacias-de-turno"

    let evento: EventoCalendario | undefined
    try {
      const params = new URLSearchParams({
        key: CALENDAR_API_KEY,
        timeMin: `${fecha}T00:00:00-03:00`,
        maxResults: "5",
        singleEvents: "true",
        orderBy: "startTime",
        fields: "items(summary,start)",
      })
      const res = await fetch(`${CALENDAR_URL}?${params}`, { signal: AbortSignal.timeout(30_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status} (calendario)`)
      const data = (await res.json()) as { items: EventoCalendario[] }
      evento = data.items.find((e) => e.start.date === fecha)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error(`[ushuaia] Fetch de calendario fallido: ${err.message}`)
      return { ciudad_slug: this.ciudad_slug, status: "failed", rows: [], source_url, error: err }
    }

    if (!evento) {
      logger.warn(`[ushuaia] Sin evento de calendario para ${fecha}`)
      return { ciudad_slug: this.ciudad_slug, status: "no_data", rows: [], source_url }
    }

    const nombre = evento.summary.trim()

    let direccion: string | undefined
    try {
      const params = new URLSearchParams()
      params.append("fields", "nombre_en_api")
      params.append("fields", "domicilio")
      const res = await fetch(`${DIRECTUS_URL}?${params}`, { signal: AbortSignal.timeout(30_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status} (directorio)`)
      const data = (await res.json()) as { data: FarmaciaDirectus[] }
      const match = data.data.find(
        (f) => (f.nombre_en_api ?? "").trim().toLowerCase() === nombre.toLowerCase()
      )
      direccion = match?.domicilio?.trim()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.warn(`[ushuaia] Fetch de directorio falló, se sigue sin dirección: ${err.message}`)
    }

    if (!direccion) {
      logger.warn(`[ushuaia] "${nombre}" sin dirección en el directorio — se omite`)
      return { ciudad_slug: this.ciudad_slug, status: "no_data", rows: [], source_url }
    }

    const rows: ScrapedTurno[] = [
      {
        ciudad_slug: this.ciudad_slug,
        fecha_turno: fecha,
        nombre_farmacia: nombre,
        direccion,
        inicio_turno: parseARTimeToISO(fecha, "09:00"),
        fin_turno: parseARTimeToISO(siguienteDia(fecha), "09:00"),
      },
    ]

    logger.info(`[ushuaia] "${nombre}" — ${direccion}`)
    return { ciudad_slug: this.ciudad_slug, status: "success", rows, source_url }
  }
}

export const ushuaiaScraper = new UshuaiaScraper()
