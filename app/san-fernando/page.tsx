export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronRight, MapPin, Clock, Info } from "lucide-react"
import { PharmacyCard } from "@/components/pharmacy-card"
import type { Metadata } from "next"
import { hoyArgentinaYYYYMMDD, hoyArgentinaHumano } from "@/lib/fechaArgentina"


type TurnoRow = {
  ciudad: string
  fecha_turno: string
  nombre_farmacia: string
  direccion: string
  telefono?: string | number
  notas?: string
  inicio_turno?: string
  fin_turno?: string
}

function normalize(s: unknown) {
  return String(s ?? "").trim().toLowerCase()
}

// Convierte "2025-12-23T03:00:00.000Z" -> "2025-12-23" en horario Argentina
function fechaISOArgentinaFromISODateTime(value: string) {
  const raw = String(value ?? "").trim()
  if (!raw) return ""

  // Caso 1: viene "23/12/2025" (DD/MM/YYYY)
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) {
    const [, dd, mm, yyyy] = m
    return `${yyyy}-${mm}-${dd}` // "2025-12-23"
  }

  // Caso 2: viene ISO / DateTime ("2025-12-23T03:00:00.000Z" o "2025-12-23")
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ""

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}


function parseARDateTime(raw: string) {
  const s = String(raw ?? "").trim()
  if (!s) return null

  // Caso A: "D/M/YYYY H:MM" o "DD/MM/YYYY HH:MM"
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/)
  if (m) {
    const [, d1, m1, yyyy, h1, MM] = m
    const dd = String(d1).padStart(2, "0")
    const mm = String(m1).padStart(2, "0")
    const HH = String(h1).padStart(2, "0")
    return {
      isoDate: `${yyyy}-${mm}-${dd}`,
      minutes: Number(HH) * 60 + Number(MM),
    }
  }

  // Caso B: ISO (ej: "2025-12-24T11:30:00.000Z") u otro parseable por Date()
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null

  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)

  const [HH, MM] = time.split(":")
  return {
    isoDate,
    minutes: Number(HH) * 60 + Number(MM),
  }
}



// "ahora" en Argentina -> { isoDate: "YYYY-MM-DD", minutes: 0..1439 }
function nowArgentinaParts() {
  const d = new Date()
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)

  const [HH, MM] = time.split(":")
  return { isoDate: parts, minutes: Number(HH) * 60 + Number(MM) }
}

// True si ahora está dentro del intervalo [inicio, fin)
function isOnDutyNow(row: TurnoRow) {
  const ini = parseARDateTime(String(row.inicio_turno ?? ""))
  const fin = parseARDateTime(String(row.fin_turno ?? ""))
  if (!ini || !fin) return false

  const now = nowArgentinaParts()

  // Comparación por (fechaISO, minutos)
  const toKey = (isoDate: string, minutes: number) => `${isoDate} ${String(minutes).padStart(4, "0")}`

  const nowKey = toKey(now.isoDate, now.minutes)
  const iniKey = toKey(ini.isoDate, ini.minutes)
  const finKey = toKey(fin.isoDate, fin.minutes)

  return nowKey >= iniKey && nowKey < finKey
}




async function fetchTurnos(ciudad: string): Promise<TurnoRow[]> {
  const baseUrl = process.env.SHEETS_API_URL
  if (!baseUrl) throw new Error("Falta SHEETS_API_URL en Vercel env vars")

  const url = `${baseUrl}?ciudad=${encodeURIComponent(ciudad)}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Error fetch turnos: ${res.status}`)

  const json = await res.json()
  return (json.data ?? []) as TurnoRow[]
}



export const metadata: Metadata = {
  title: "Farmacias de turno hoy en San Fernando | Web farmacias de turno",
  description:
    "Farmacias de turno hoy en San Fernando. Información actualizada con direcciones, teléfonos y horarios.",
}



export default async function SanNicolasPage() {
  
  const hoyISO = hoyArgentinaYYYYMMDD()
  const currentDate = { dateString: hoyArgentinaHumano() }

  const ciudadParam = "San Fernando"
  const turnos = await fetchTurnos(ciudadParam)

  const turnosSanFernando = turnos.filter(
    (x) => normalize(x.ciudad) === normalize(ciudadParam)
  )

  const pharmaciesOnDutyNow = turnosSanFernando.filter(isOnDutyNow)

  const otherPharmacies = turnosSanFernando.filter((x) => !isOnDutyNow(x))



  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">Farmacias de turno</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">San Fernando</span>
        </nav>
      </div>

      <main className="flex-1 container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-balance leading-tight">
              Farmacias de turno hoy en San Fernando
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base py-1.5 px-3">
                <Clock className="w-4 h-4 mr-1.5" />
                {currentDate.dateString}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">Estas son las farmacias que están de turno ahora.</p>
          </div>

          {pharmaciesOnDutyNow.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Farmacias de turno hoy</h2>
                <Badge className="bg-accent text-accent-foreground">{pharmaciesOnDutyNow.length}</Badge>
              </div>
              <div className="grid gap-4">
                {pharmaciesOnDutyNow.map((x, index) => (
                  <PharmacyCard
                    key={index}
                    pharmacy={{
                      name: x.nombre_farmacia,
                      address: x.direccion,
                      phone: String(x.telefono ?? ""),
                      hours: `${x.inicio_turno} → ${x.fin_turno}`,
                      notes: x.notas,
                    }}
                    isOnDuty={true}
                  />
                ))}
              </div>
            </section>
          ) : (
            <Card className="border-2 border-muted">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">No hay farmacias de turno registradas</CardTitle>
                    <CardDescription className="text-base mt-2">
                      Hoy no hay farmacias de turno registradas para San Fernando. Por favor, consultá más tarde o
                      contactá con las farmacias de la ciudad.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {otherPharmacies.length > 0 && (
            <section className="space-y-4 pt-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Otras farmacias de la ciudad</h2>
                <p className="text-muted-foreground">Estas farmacias pueden estar disponibles en otros días.</p>
              </div>
              <div className="grid gap-3">
                {otherPharmacies.map((x, index) => (
                    <PharmacyCard
                      key={index}
                      pharmacy={{
                        name: x.nombre_farmacia,
                        address: x.direccion,
                        phone: String(x.telefono ?? ""),
                        notes: x.notas,
                      }}
                      isOnDuty={false}
                    />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Farmacias de turno. Información actualizada diariamente.
          </p>
        </div>
      </footer>
    </div>
  )
}
