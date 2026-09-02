import { hoyArgentinaYYYYMMDD } from "./lib/fecha.js"
import { logger } from "./lib/logger.js"
import { upsertTurnos, registrarScraperRun } from "./lib/upsert.js"
import { sendTelegramAlert } from "./lib/telegram.js"
import { supabase } from "./lib/supabase-client.js"
import type { ICityScraper, ScraperResult } from "./lib/types.js"
import { ManualFallbackError } from "./lib/types.js"
import { predecirLetraTurnoSanNicolas } from "./lib/prediccion-san-nicolas.js"

import { santaRosaScraper, generalPicoScraper } from "./scrapers/santa-rosa/index.js"
import { sanNicolasScraper } from "./scrapers/san-nicolas/index.js"
import { sanRafaelScraper } from "./scrapers/san-rafael/index.js"
import { sanPedroScraper } from "./scrapers/san-pedro/index.js"
import { sanFernandoScraper } from "./scrapers/san-fernando/index.js"
import { laPlataScraper, losHornosScraper } from "./scrapers/la-plata/index.js"
import { berazateguiScraper, platanosScraper, hudsonScraper } from "./scrapers/berazategui/index.js"
import { santaFeScraper, santoTomeScraper } from "./scrapers/santa-fe/index.js"
import { rioGrandeScraper, ushuaiaScraper } from "./scrapers/rio-grande/index.js"

// Venado Tuerto sale temporalmente de la rotación: su única fuente
// (cofarsf.org.ar) quedó con el dominio caído (NXDOMAIN) y no se encontró
// un reemplazo confiable. La ciudad también se sacó de app/page.tsx y del
// sitemap. Reactivar acá cuando haya una fuente nueva.
const ALL_SCRAPERS: ICityScraper[] = [
  sanNicolasScraper,
  sanPedroScraper,
  santaRosaScraper,
  generalPicoScraper,
  sanFernandoScraper,
  sanRafaelScraper,
  laPlataScraper,
  losHornosScraper,
  berazateguiScraper,
  platanosScraper,
  hudsonScraper,
  santaFeScraper,
  santoTomeScraper,
  rioGrandeScraper,
  ushuaiaScraper,
]

// Ciudades sin fuente automática, cargadas a mano vía el bot de Telegram
// (telegram-bot/). Mantener en sync con CIUDADES_MANUALES en
// telegram-bot/lib/types.ts.
const CIUDADES_MANUALES = ["venado-tuerto", "san-pedro", "san-nicolas"]

interface RunOutcome {
  ciudad_slug: string
  outcome: "manual" | "success" | "no_data" | "failed"
  error_msg?: string
}

async function runScraper(scraper: ICityScraper, fecha: string): Promise<RunOutcome> {
  const started_at = new Date().toISOString()

  try {
    const result: ScraperResult = await scraper.scrape(fecha)

    // Stubs de ciudades sin fuente: no registrar error, solo skip silencioso
    if (result.error instanceof ManualFallbackError) {
      logger.info(`[${scraper.ciudad_slug}] Sin fuente oficial — skip (carga manual en Supabase)`)
      return { ciudad_slug: scraper.ciudad_slug, outcome: "manual" }
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

    return {
      ciudad_slug: scraper.ciudad_slug,
      outcome: result.status === "success" ? "success" : result.status === "no_data" ? "no_data" : "failed",
      error_msg: result.error?.message,
    }
  } catch (err) {
    // Cualquier excepción no capturada por el scraper individual se
    // convierte en outcome "failed" en vez de tumbar Promise.allSettled,
    // así la verificación post-corrida siempre conoce el estado real de
    // cada ciudad pedida (necesario para no perder alertas).
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`[${scraper.ciudad_slug}] Excepción no capturada:`, err)
    return { ciudad_slug: scraper.ciudad_slug, outcome: "failed", error_msg: message }
  }
}

// Confirma contra Supabase (no solo contra lo que reportó el scraper en
// memoria) que cada ciudad automatizada haya quedado con datos de la fecha
// de hoy, y avisa por Telegram si alguna quedó sin actualizar.
async function verificarYAlertar(fecha: string, outcomes: RunOutcome[]): Promise<void> {
  const ciudadesAutomatizadas = outcomes.filter((o) => o.outcome !== "manual")
  if (ciudadesAutomatizadas.length === 0) return

  const { data, error } = await supabase
    .from("farmacias_turno")
    .select("ciudad_slug")
    .eq("fecha_turno", fecha)
    .in("ciudad_slug", ciudadesAutomatizadas.map((o) => o.ciudad_slug))

  if (error) {
    logger.error("[verificacion] Error al consultar Supabase:", error.message)
    await sendTelegramAlert(
      `⚠️ <b>Farmacias de turno</b>\nNo se pudo verificar el estado post-corrida (${fecha}): ${error.message}`
    )
    return
  }

  const ciudadesConDatos = new Set((data ?? []).map((r) => r.ciudad_slug as string))
  const faltantes = ciudadesAutomatizadas.filter((o) => !ciudadesConDatos.has(o.ciudad_slug))

  if (faltantes.length === 0) {
    logger.info(
      `[verificacion] OK — las ${ciudadesAutomatizadas.length} ciudades automatizadas tienen datos de hoy (${fecha})`
    )
    return
  }

  const detalle = faltantes
    .map((f) => {
      const base = `• <b>${f.ciudad_slug}</b>${f.error_msg ? ` — ${f.error_msg}` : " — sin datos de hoy"}`
      // San Nicolás: además del error, informar la predicción del ciclo de
      // turnos (ver scrapers/lib/prediccion-san-nicolas.ts) — es solo una
      // ayuda visual, el operador confirma la letra real por Telegram.
      if (f.ciudad_slug === "san-nicolas") {
        return `${base}\n  Predicción del ciclo: Turno ${predecirLetraTurnoSanNicolas(fecha)} (sin confirmar — respondé la letra correcta por el bot)`
      }
      return base
    })
    .join("\n")

  logger.error(
    `[verificacion] ${faltantes.length} ciudades sin datos de hoy: ${faltantes.map((f) => f.ciudad_slug).join(", ")}`
  )

  await sendTelegramAlert(`🚨 <b>Farmacias de turno — sin actualizar (${fecha})</b>\n\n${detalle}`)
}

// Ciudades sin scraper (cargadas a mano por Telegram) no tienen una corrida
// diaria que las renueve — el cronograma cargado se agota solo. Avisa por
// Telegram cuando el último día con datos es hoy o ya pasó, para que se
// mande una foto nueva antes de que la web quede sin turno vigente.
async function verificarCoberturaManual(fecha: string): Promise<void> {
  const { data, error } = await supabase
    .from("farmacias_turno")
    .select("ciudad_slug, fecha_turno")
    .in("ciudad_slug", CIUDADES_MANUALES)
    .order("fecha_turno", { ascending: false })

  if (error) {
    logger.error("[cobertura-manual] Error al consultar Supabase:", error.message)
    return
  }

  const ultimaFechaPorCiudad = new Map<string, string>()
  for (const row of data ?? []) {
    if (!ultimaFechaPorCiudad.has(row.ciudad_slug)) {
      ultimaFechaPorCiudad.set(row.ciudad_slug, row.fecha_turno)
    }
  }

  const porVencer = CIUDADES_MANUALES
    .filter((ciudad) => ultimaFechaPorCiudad.has(ciudad)) // ignorar ciudades nunca cargadas (ej. San Pedro todavía sin usar)
    .map((ciudad) => ({ ciudad, ultimaFecha: ultimaFechaPorCiudad.get(ciudad)! }))
    .filter(({ ultimaFecha }) => ultimaFecha <= fecha)

  if (porVencer.length === 0) {
    logger.info("[cobertura-manual] OK — todas las ciudades manuales con cronograma tienen días por delante")
    return
  }

  const detalle = porVencer
    .map(({ ciudad, ultimaFecha }) =>
      ultimaFecha === fecha
        ? `• <b>${ciudad}</b> — hoy es el último día cargado`
        : `• <b>${ciudad}</b> — sin cronograma desde el ${ultimaFecha}`
    )
    .join("\n")

  logger.error(`[cobertura-manual] ${porVencer.length} ciudades manuales por quedarse sin cronograma`)

  await sendTelegramAlert(
    `📸 <b>Farmacias de turno — mandá una foto nueva</b>\n\n${detalle}`
  )
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

  const outcomes: RunOutcome[] = []
  let excepciones = 0
  for (const r of results) {
    if (r.status === "rejected") {
      logger.error(`Scraper terminó con excepción no capturada:`, r.reason)
      excepciones++
    } else {
      outcomes.push(r.value)
    }
  }

  await verificarYAlertar(fecha, outcomes)
  await verificarCoberturaManual(fecha)

  const fallaron = outcomes.filter((o) => o.outcome === "failed").length
  if (fallaron > 0 || excepciones > 0) {
    logger.error(`${fallaron + excepciones} scrapers fallaron`)
    process.exit(1)
  }

  logger.info("Scrapers completados.")
}

main().catch((err) => {
  logger.error("Error fatal:", err)
  process.exit(1)
})
