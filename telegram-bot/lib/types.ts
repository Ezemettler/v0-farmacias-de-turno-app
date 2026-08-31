// Ciudades habilitadas para el flujo de carga manual vía Telegram.
// Extender esta lista cuando se sume una ciudad nueva.
export const CIUDADES_MANUALES = ["venado-tuerto", "san-pedro", "san-nicolas"] as const
export type CiudadManual = (typeof CIUDADES_MANUALES)[number]

// Normaliza texto libre a formato slug (minúsculas, sin acentos, espacios ->
// guiones) para que el operador pueda escribir "San Nicolás", "san nicolas"
// o "san-nicolas" indistintamente y matchee igual.
function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Intenta resolver texto libre (caption o mensaje de texto) a una ciudad
// habilitada. Devuelve null si no matchea ninguna.
export function resolverCiudadManual(valor: string): CiudadManual | null {
  const normalizado = normalizarTexto(valor)
  return (CIUDADES_MANUALES as readonly string[]).includes(normalizado)
    ? (normalizado as CiudadManual)
    : null
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
