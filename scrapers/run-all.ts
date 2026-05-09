import { hoyArgentinaYYYYMMDD } from "./lib/fecha.js"
import { logger } from "./lib/logger.js"
import { upsertTurnos, registrarScraperRun } from "./lib/upsert.js"
import type { ICityScraper, ScraperResult } from "./lib/types.js"
import { ManualFallbackError } from "./lib/types.js"

import { santaRosaScraper, generalPicoScraper } from "./scrapers/santa-rosa/index.js"
import { sanNicolasScraper } from "./scrapers/san-nicolas/index.js"
import { venadoTuertoScraper } from "./scrapers/venado-tuerto/index.js"
import { sanRafaelScraper } from "./scrapers/san-rafael/index.js"
import { sanPedroScraper } from "./scrapers/san-pedro/index.js"
import { sanFernandoScraper } from "./scrapers/san-fernando/index.js"

const ALL_SCRAPERS: ICityScraper[] = [
  sanNicolasScraper,
  sanPedroScraper,
  santaRosaScraper,
  generalPicoScraper,
  sanFernandoScraper,
  venadoTuertoScraper,
  sanRafaelScraper,
]

async function runScraper(scraper: ICityScraper, fecha: string): Promise<void> {
  const started_at = new Date().toISOString()

  const result: ScraperResult = await scraper.scrape(fecha)

  // Stubs de ciudades sin fuente: no registrar error, solo skip silencioso
  if (result.error instanceof ManualFallbackError) {
    logger.info(`[${scraper.ciudad_slug}] Sin fuente oficial — skip (carga manual en Supabase)`)
    return
  }

  // Insertar run en scraper_runs (antes del upsert para obtener el ID)
  const upsertResult = result.status !== "failed"
    ? await upsertTurnos(result, 0) // ID provisional; actualizar con run real abajo
    : { rows_upserted: 0, error: result.error?.message }

  await registrarScraperRun({
    ciudad_slug: scraper.ciudad_slug,
    scraper_key: scraper.scraper_key,
    fecha_turno: fecha,
    status: result.status,
    rows_upserted: upsertResult.rows_upserted,
    error_msg: result.error?.message,
    source_url: result.source_url,
    started_at,
  })
}

async function main(): Promise<void> {
  const fecha = process.env.TARGET_FECHA || hoyArgentinaYYYYMMDD()
  const targetCiudad = process.env.TARGET_CIUDAD || ""

  const scrapers = targetCiudad
    ? ALL_SCRAPERS.filter((s) => s.ciudad_slug === targetCiudad)
    : ALL_SCRAPERS

  if (scrapers.length === 0) {
    logger.error(`No se encontró scraper para ciudad: "${targetCiudad}"`)
    process.exit(1)
  }

  logger.info(`Iniciando scrapers para fecha ${fecha} — ${scrapers.length} ciudades`)

  const results = await Promise.allSettled(
    scrapers.map((s) => runScraper(s, fecha))
  )

  let failures = 0
  for (const r of results) {
    if (r.status === "rejected") {
      logger.error(`Scraper terminó con excepción no capturada:`, r.reason)
      failures++
    }
  }

  if (failures > 0) {
    logger.error(`${failures} scrapers fallaron`)
    process.exit(1)
  }

  logger.info("Scrapers completados.")
}

main().catch((err) => {
  logger.error("Error fatal:", err)
  process.exit(1)
})
