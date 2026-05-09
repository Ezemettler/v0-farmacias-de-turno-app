import { supabase } from "./supabase-client.js"
import { logger } from "./logger.js"
import type { ScrapedTurno, ScraperResult } from "./types.js"

export interface UpsertResult {
  rows_upserted: number
  error?: string
}

export async function upsertTurnos(
  result: ScraperResult,
  scraper_run_id: number
): Promise<UpsertResult> {
  if (result.rows.length === 0) {
    return { rows_upserted: 0 }
  }

  const rows = result.rows.map((r) => ({
    ciudad_slug: r.ciudad_slug,
    fecha_turno: r.fecha_turno,
    nombre_farmacia: r.nombre_farmacia,
    direccion: r.direccion,
    telefono: r.telefono ?? null,
    inicio_turno: r.inicio_turno ?? null,
    fin_turno: r.fin_turno ?? null,
    notas: r.notas ?? null,
    fuente: "scraper",
    scraper_run_id,
  }))

  // Upsert: ON CONFLICT (ciudad_slug, fecha_turno, nombre_farmacia)
  // Solo actualiza filas donde es_override_manual = false
  // Supabase no soporta WHERE en ON CONFLICT via JS SDK,
  // por eso usamos RPC o insertamos y filtramos manualmente.
  //
  // Estrategia: fetch overrides manuales primero, excluirlos del upsert.
  const { data: overrides, error: overrideError } = await supabase
    .from("farmacias_turno")
    .select("nombre_farmacia")
    .eq("ciudad_slug", result.ciudad_slug)
    .eq("fecha_turno", result.rows[0]?.fecha_turno ?? "")
    .eq("es_override_manual", true)

  if (overrideError) {
    logger.warn(`[upsert] Error al leer overrides: ${overrideError.message}`)
  }

  const overrideNames = new Set((overrides ?? []).map((o) => o.nombre_farmacia))
  const rowsToUpsert = rows.filter((r) => !overrideNames.has(r.nombre_farmacia))

  if (rowsToUpsert.length === 0) {
    logger.info(`[upsert] Todas las filas son overrides manuales, nada que actualizar.`)
    return { rows_upserted: 0 }
  }

  const { error } = await supabase.from("farmacias_turno").upsert(rowsToUpsert, {
    onConflict: "ciudad_slug,fecha_turno,nombre_farmacia",
    ignoreDuplicates: false,
  })

  if (error) {
    logger.error(`[upsert] Error: ${error.message}`)
    return { rows_upserted: 0, error: error.message }
  }

  logger.info(`[upsert] ${rowsToUpsert.length} filas guardadas para ${result.ciudad_slug}`)
  return { rows_upserted: rowsToUpsert.length }
}

export async function registrarScraperRun(params: {
  ciudad_slug: string
  scraper_key: string
  fecha_turno: string
  status: "success" | "partial" | "failed" | "no_data"
  rows_upserted: number
  error_msg?: string
  source_url: string
  started_at: string
}): Promise<number | null> {
  const { data, error } = await supabase
    .from("scraper_runs")
    .insert({
      ...params,
      finished_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) {
    logger.error(`[scraper_runs] Error al registrar run: ${error.message}`)
    return null
  }

  return (data as { id: number }).id
}
