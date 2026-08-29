import { supabase } from "./supabase-client.js"
import { horaLocalAISO, siguienteDia } from "./fecha.js"
import type { CiudadManual } from "./types.js"
import type { ResultadoExtraccion } from "./types.js"

export interface UpsertManualResult {
  filas_guardadas: number
  error?: string
}

export async function upsertEntradasManuales(
  ciudad_slug: CiudadManual,
  resultado: ResultadoExtraccion
): Promise<UpsertManualResult> {
  if (resultado.entradas.length === 0) {
    return { filas_guardadas: 0 }
  }

  const rows = resultado.entradas.map((e) => {
    const fechaFin = e.fin_turno_dia_siguiente ? siguienteDia(e.fecha_turno) : e.fecha_turno
    return {
      ciudad_slug,
      fecha_turno: e.fecha_turno,
      nombre_farmacia: e.nombre_farmacia,
      direccion: e.direccion,
      telefono: e.telefono ?? null,
      inicio_turno: horaLocalAISO(e.fecha_turno, e.inicio_turno) ?? null,
      fin_turno: horaLocalAISO(fechaFin, e.fin_turno) ?? null,
      // resultado.notas es metodología de extracción (ambigüedades, cómo se
      // interpretó la imagen) — va en la respuesta de Telegram al operador,
      // no en la web pública. La tarjeta de farmacia renderiza "notas" tal
      // cual, así que cargarlo acá lo mostraría repetido en cada farmacia.
      notas: null,
      fuente: "manual_telegram",
      es_override_manual: true,
    }
  })

  const { error } = await supabase
    .from("farmacias_turno")
    .upsert(rows, { onConflict: "ciudad_slug,fecha_turno,nombre_farmacia", ignoreDuplicates: false })

  if (error) {
    return { filas_guardadas: 0, error: error.message }
  }

  return { filas_guardadas: rows.length }
}
