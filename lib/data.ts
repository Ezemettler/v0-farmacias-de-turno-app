// lib/data.ts

/**
 * Modelo de farmacia utilizado en la UI.
 * Alineado con datos reales provenientes de Google Sheets.
 * Todos los campos operativos son opcionales para evitar errores de render.
 */

export interface Pharmacy {
  /** Nombre de la farmacia */
  name: string

  /** Dirección completa (calle + número + ciudad + provincia) */
  address: string

  /** Teléfono (puede no existir) */
  phone?: string

  /** Horario del turno (ej: "08:30 a 08:30", "24 horas") */
  hours?: string

  /** Notas adicionales del turno */
  notes?: string

  /**
   * Campos opcionales para futuros usos
   * (SEO, filtros, otras vistas, etc.)
   */
  city?: string
  dutyDate?: string // YYYY-MM-DD
}

/**
 * Mock data opcional.
 * Puede eliminarse cuando todo consuma directamente desde la API.
 */
export const pharmacyData: Pharmacy[] = [
  {
    name: "Farmacia San Nicolás",
    address: "Av. Moreno 145, San Nicolás de los Arroyos, Buenos Aires",
    phone: "0336-442-3456",
    hours: "24 horas",
    notes: "Abierto toda la noche",
    city: "San Nicolás de los Arroyos",
    dutyDate: new Date().toISOString().split("T")[0],
  },
  {
    name: "Farmacia Del Centro",
    address: "Mitre 89, San Nicolás de los Arroyos, Buenos Aires",
    phone: "0336-442-7890",
    hours: "08:00 a 22:00",
    city: "San Nicolás de los Arroyos",
    dutyDate: new Date().toISOString().split("T")[0],
  },
]
