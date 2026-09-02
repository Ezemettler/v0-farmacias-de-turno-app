import { supabase } from "./supabase-client.js"
import { horaLocalAISO, siguienteDia } from "./fecha.js"
import type { CiudadManual } from "./types.js"
import type { ResultadoExtraccion } from "./types.js"
import { ROSTER_SAN_NICOLAS, type LetraTurno } from "./turnos-san-nicolas.js"

export interface UpsertManualResult {
  filas_guardadas: number
  error?: string
}

// A diferencia de upsertEntradasManuales (que puede traer varias fechas de
// una foto de cronograma), acá siempre es UN solo día con UN padrón fijo —
// así que se reemplaza lo que haya para esa fecha en vez de sumarlo, para
// no repetir el problema de datos mezclados que ya pasó una vez.
export async function cargarTurnoSanNicolas(
  letra: LetraTurno,
  fecha_turno: string
): Promise<UpsertManualResult> {
  const { error: errorDelete } = await supabase
    .from("farmacias_turno")
    .delete()
    .eq("ciudad_slug", "san-nicolas")
    .eq("fecha_turno", fecha_turno)

  if (errorDelete) {
    return { filas_guardadas: 0, error: errorDelete.message }
  }

  const inicio_turno = horaLocalAISO(fecha_turno, "08:30") ?? null
  const fin_turno = horaLocalAISO(siguienteDia(fecha_turno), "08:30") ?? null

  const rows = ROSTER_SAN_NICOLAS[letra].map((f) => ({
    ciudad_slug: "san-nicolas",
    fecha_turno,
    nombre_farmacia: f.nombre,
    direccion: f.direccion,
    telefono: null,
    inicio_turno,
    fin_turno,
    notas: null,
    fuente: "manual_telegram_turno",
    es_override_manual: true,
  }))

  const { error } = await supabase.from("farmacias_turno").insert(rows)

  if (error) {
    return { filas_guardadas: 0, error: error.message }
  }

  return { filas_guardadas: rows.length }
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
