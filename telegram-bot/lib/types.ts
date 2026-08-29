// Ciudades habilitadas para el flujo de carga manual vía Telegram.
// Extender esta lista cuando se sume una ciudad nueva (ej. San Pedro).
export const CIUDADES_MANUALES = ["venado-tuerto", "san-pedro"] as const
export type CiudadManual = (typeof CIUDADES_MANUALES)[number]

export function esCiudadManualValida(valor: string): valor is CiudadManual {
  return (CIUDADES_MANUALES as readonly string[]).includes(valor)
}

export interface EntradaExtraida {
  fecha_turno: string // YYYY-MM-DD
  nombre_farmacia: string
  direccion: string
  telefono?: string | null
  inicio_turno: string // HH:MM
  fin_turno: string // HH:MM
  fin_turno_dia_siguiente: boolean
}

export interface ResultadoExtraccion {
  entradas: EntradaExtraida[]
  confianza: "alta" | "media" | "baja"
  notas: string | null
}
