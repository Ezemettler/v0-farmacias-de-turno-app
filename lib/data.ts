export interface Pharmacy {
  city: string
  dutyDate: string // ISO format YYYY-MM-DD
  name: string
  address: string
  phone: string
  dutyHours?: string
  notes?: string
}

// Mock data - replace with API call to Google Sheets later
export const pharmacyData: Pharmacy[] = [
  {
    city: "San Nicolás de los Arroyos",
    dutyDate: new Date().toISOString().split("T")[0], // Today
    name: "Farmacia San Nicolás",
    address: "Av. Moreno 145, San Nicolás de los Arroyos",
    phone: "0336-442-3456",
    dutyHours: "24 horas",
    notes: "Abierto toda la noche",
  },
  {
    city: "San Nicolás de los Arroyos",
    dutyDate: new Date().toISOString().split("T")[0], // Today
    name: "Farmacia Del Centro",
    address: "Mitre 89, San Nicolás de los Arroyos",
    phone: "0336-442-7890",
    dutyHours: "8:00 - 22:00",
  },
  {
    city: "San Nicolás de los Arroyos",
    dutyDate: "2025-12-21", // Tomorrow (example)
    name: "Farmacia Nueva",
    address: "San Martín 234, San Nicolás de los Arroyos",
    phone: "0336-443-1234",
    dutyHours: "24 horas",
  },
  {
    city: "San Nicolás de los Arroyos",
    dutyDate: "2025-12-22", // Day after tomorrow (example)
    name: "Farmacia La Salud",
    address: "Belgrano 567, San Nicolás de los Arroyos",
    phone: "0336-444-5678",
    dutyHours: "9:00 - 21:00",
    notes: "Cerrado los domingos",
  },
]
