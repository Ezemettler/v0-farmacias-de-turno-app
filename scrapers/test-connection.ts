/**
 * Verifica que la conexión a Supabase funciona y que el schema está correcto.
 * Uso: SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=eyJ... tsx test-connection.ts
 */
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Faltan vars de entorno: SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function main() {
  console.log("🔌 Testeando conexión a Supabase...\n")

  // 1. Leer ciudades (verifica que las 3 tablas existen y el seed corrió)
  const { data: ciudades, error: errCiudades } = await supabase
    .from("ciudades")
    .select("slug, nombre, provincia, scraper_key")
    .order("slug")

  if (errCiudades) {
    console.error("❌ Error al leer tabla 'ciudades':", errCiudades.message)
    process.exit(1)
  }

  console.log(`✅ Tabla 'ciudades' OK — ${ciudades?.length ?? 0} ciudades encontradas:`)
  for (const c of ciudades ?? []) {
    const scraper = c.scraper_key ?? "(sin scraper — carga manual)"
    console.log(`   • ${c.slug.padEnd(15)} ${c.nombre.padEnd(32)} → ${scraper}`)
  }

  // 2. Verificar tabla farmacias_turno
  const { count, error: errFarmacias } = await supabase
    .from("farmacias_turno")
    .select("*", { count: "exact", head: true })

  if (errFarmacias) {
    console.error("\n❌ Error al leer tabla 'farmacias_turno':", errFarmacias.message)
    process.exit(1)
  }
  console.log(`\n✅ Tabla 'farmacias_turno' OK — ${count ?? 0} filas actuales`)

  // 3. Verificar tabla scraper_runs
  const { count: countRuns, error: errRuns } = await supabase
    .from("scraper_runs")
    .select("*", { count: "exact", head: true })

  if (errRuns) {
    console.error("\n❌ Error al leer tabla 'scraper_runs':", errRuns.message)
    process.exit(1)
  }
  console.log(`✅ Tabla 'scraper_runs' OK — ${countRuns ?? 0} runs registrados`)

  // 4. Test de escritura: insertar una fila de prueba y borrarla
  const testRow = {
    ciudad_slug: "san-nicolas",
    fecha_turno: "1970-01-01",
    nombre_farmacia: "__test_connection__",
    direccion: "Test 123",
    fuente: "test",
  }

  const { error: errInsert } = await supabase.from("farmacias_turno").insert(testRow)
  if (errInsert) {
    console.error("\n❌ Error al escribir en 'farmacias_turno':", errInsert.message)
    process.exit(1)
  }

  const { error: errDelete } = await supabase
    .from("farmacias_turno")
    .delete()
    .eq("nombre_farmacia", "__test_connection__")
    .eq("fecha_turno", "1970-01-01")

  if (errDelete) {
    console.warn("\n⚠️  Fila de test insertada pero no se pudo borrar:", errDelete.message)
  }

  console.log("✅ Escritura y borrado en 'farmacias_turno' OK")
  console.log("\n🎉 Conexión a Supabase completamente funcional.")
}

main().catch((err) => {
  console.error("Error fatal:", err)
  process.exit(1)
})
