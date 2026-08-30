/**
 * Entry point para testing de un scraper individual sin escribir en Supabase.
 * Uso: tsx run-city.ts <ciudad-slug> [fecha-YYYY-MM-DD]
 * Ejemplo: tsx run-city.ts santa-rosa 2025-12-23
 */
import { logger } from "./lib/logger.js"
import { hoyArgentinaYYYYMMDD } from "./lib/fecha.js"
import type { ICityScraper } from "./lib/types.js"

import { santaRosaScraper, generalPicoScraper } from "./scrapers/santa-rosa/index.js"
import { sanNicolasScraper } from "./scrapers/san-nicolas/index.js"
import { venadoTuertoScraper } from "./scrapers/venado-tuerto/index.js"
import { sanRafaelScraper } from "./scrapers/san-rafael/index.js"
import { sanPedroScraper } from "./scrapers/san-pedro/index.js"
import { sanFernandoScraper } from "./scrapers/san-fernando/index.js"
import { laPlataScraper, losHornosScraper } from "./scrapers/la-plata/index.js"
import { berazateguiScraper, platanosScraper, hudsonScraper } from "./scrapers/berazategui/index.js"
import { santaFeScraper, santoTomeScraper } from "./scrapers/santa-fe/index.js"
import { rioGrandeScraper, ushuaiaScraper } from "./scrapers/rio-grande/index.js"

const SCRAPERS: Record<string, ICityScraper> = {
  "san-nicolas": sanNicolasScraper,
  "san-pedro": sanPedroScraper,
  "santa-rosa": santaRosaScraper,
  "general-pico": generalPicoScraper,
  "san-fernando": sanFernandoScraper,
  "venado-tuerto": venadoTuertoScraper,
  "san-rafael": sanRafaelScraper,
  "la-plata": laPlataScraper,
  "los-hornos": losHornosScraper,
  "berazategui": berazateguiScraper,
  "platanos": platanosScraper,
  "hudson": hudsonScraper,
  "santa-fe": santaFeScraper,
  "santo-tome": santoTomeScraper,
  "rio-grande": rioGrandeScraper,
  "ushuaia": ushuaiaScraper,
}

async function main(): Promise<void> {
  const ciudadSlug = process.argv[2]
  const fecha = process.argv[3] || hoyArgentinaYYYYMMDD()

  if (!ciudadSlug) {
    console.log("Uso: tsx run-city.ts <ciudad-slug> [fecha-YYYY-MM-DD]")
    console.log("Ciudades disponibles:", Object.keys(SCRAPERS).join(", "))
    process.exit(1)
  }

  const scraper = SCRAPERS[ciudadSlug]
  if (!scraper) {
    logger.error(`Ciudad no reconocida: "${ciudadSlug}"`)
    console.log("Ciudades disponibles:", Object.keys(SCRAPERS).join(", "))
    process.exit(1)
  }

  logger.info(`Testing scraper "${ciudadSlug}" para fecha ${fecha}...`)
  const result = await scraper.scrape(fecha)

  console.log("\n=== RESULTADO ===")
  console.log("Status:", result.status)
  console.log("Filas:", result.rows.length)
  console.log("Fuente:", result.source_url)
  if (result.error) console.log("Error:", result.error.message)
  if (result.rows.length > 0) {
    console.log("\nPrimeras 3 filas:")
    console.log(JSON.stringify(result.rows.slice(0, 3), null, 2))
  }
}

main().catch((err) => {
  logger.error("Error:", err)
  process.exit(1)
})
