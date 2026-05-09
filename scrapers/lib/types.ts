export interface ScrapedTurno {
  ciudad_slug: string
  fecha_turno: string       // "YYYY-MM-DD" en hora Argentina
  nombre_farmacia: string
  direccion: string
  telefono?: string
  inicio_turno?: string     // ISO con offset: "2025-12-23T08:30:00-03:00"
  fin_turno?: string
  notas?: string
}

export interface ScraperResult {
  ciudad_slug: string
  status: "success" | "partial" | "failed" | "no_data"
  rows: ScrapedTurno[]
  source_url: string
  error?: Error
}

export interface ICityScraper {
  readonly ciudad_slug: string
  readonly scraper_key: string
  scrape(fechaAR?: string): Promise<ScraperResult>
}

export class ManualFallbackError extends Error {
  constructor(ciudad: string) {
    super(`No hay fuente oficial scrapeable para ${ciudad}. Usar carga manual en Supabase.`)
    this.name = "ManualFallbackError"
  }
}
