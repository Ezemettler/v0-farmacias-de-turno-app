/**
 * Script one-shot para migrar datos actuales de Google Sheets → Supabase.
 * Ejecutar UNA sola vez antes de la Fase 4 (migración del frontend).
 *
 * Uso:
 *   SHEETS_API_URL=https://... SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   tsx scripts/migrate-sheets.ts
 */

import { createClient } from "@supabase/supabase-js"

const SHEETS_API_URL = process.env.SHEETS_API_URL
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SHEETS_API_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno: SHEETS_API_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// Mapeo de nombre en Sheets → slug en Supabase
const CIUDADES: Array<{ param: string; slug: string }> = [
  { param: "San nicolas de los arroyos", slug: "san-nicolas" },
  { param: "San Pedro", slug: "san-pedro" },
  { param: "Santa Rosa", slug: "santa-rosa" },
  { param: "General Pico", slug: "general-pico" },
  { param: "San Fernando", slug: "san-fernando" },
  { param: "Venado Tuerto", slug: "venado-tuerto" },
  { param: "San Rafael", slug: "san-rafael" },
]

interface SheetRow {
  ciudad: string
  nombre_farmacia: string
  direccion: string
  telefono?: string | number
  inicio_turno?: string
  fin_turno?: string
  notas?: string
  fecha_turno?: string
}

function hoyArgentina(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

async function fetchCiudad(param: string): Promise<SheetRow[]> {
  const url = `${SHEETS_API_URL}?ciudad=${encodeURIComponent(param)}`
  console.log(`  Fetching: ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${param}`)
  const json = (await res.json()) as { data?: SheetRow[] }
  return json.data ?? []
}

async function main(): Promise<void> {
  console.log("=== Migración Google Sheets → Supabase ===\n")
  const hoy = hoyArgentina()
  let totalInserted = 0

  for (const { param, slug } of CIUDADES) {
    console.log(`[${slug}] Obteniendo datos...`)
    let rows: SheetRow[]

    try {
      rows = await fetchCiudad(param)
    } catch (err) {
      console.warn(`  [${slug}] Error al fetch: ${err}. Saltando.`)
      continue
    }

    const normalizedParam = param.trim().toLowerCase()
    const filtered = rows.filter(
      (r) => (r.ciudad ?? "").trim().toLowerCase() === normalizedParam
    )

    if (filtered.length === 0) {
      console.log(`  [${slug}] Sin datos disponibles.`)
      continue
    }

    const toInsert = filtered.map((r) => ({
      ciudad_slug: slug,
      fecha_turno: r.fecha_turno ?? hoy,
      nombre_farmacia: r.nombre_farmacia,
      direccion: r.direccion,
      telefono: r.telefono ? String(r.telefono) : null,
      inicio_turno: r.inicio_turno ?? null,
      fin_turno: r.fin_turno ?? null,
      notas: r.notas ?? null,
      fuente: "sheets_import",
    }))

    const { error } = await supabase.from("farmacias_turno").upsert(toInsert, {
      onConflict: "ciudad_slug,fecha_turno,nombre_farmacia",
      ignoreDuplicates: false,
    })

    if (error) {
      console.error(`  [${slug}] Error en upsert: ${error.message}`)
    } else {
      console.log(`  [${slug}] ✓ ${toInsert.length} filas migradas`)
      totalInserted += toInsert.length
    }
  }

  console.log(`\n=== Migración completada: ${totalInserted} filas totales ===`)
}

main().catch((err) => {
  console.error("Error fatal:", err)
  process.exit(1)
})
