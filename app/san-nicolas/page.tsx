export const dynamic = "force-dynamic"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Clock, Info } from "lucide-react"
import { PharmacyCard } from "@/components/pharmacy-card"
import type { Metadata } from "next"
import { hoyArgentinaHumano } from "@/lib/fechaArgentina"
import { fetchTurnos } from "@/lib/turnos"
import { isOnDutyNow, formatARDateTime } from "@/lib/turno-utils"

export const metadata: Metadata = {
  title: "Farmacias de turno hoy en San Nicolás | Web farmacias de turno",
  description:
    "Farmacias de turno hoy en San Nicolás de los Arroyos. Información actualizada con direcciones, teléfonos y horarios.",
}

export default async function SanNicolasPage() {
  const currentDate = { dateString: hoyArgentinaHumano() }
  const turnos = await fetchTurnos("san-nicolas")

  const pharmaciesOnDutyNow = turnos.filter(isOnDutyNow)
  const otherPharmacies = turnos.filter((x) => !isOnDutyNow(x))

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <Link href="/" className="inline-flex items-center w-fit">
            <Image
              src="/icono-farmacias-de-turno.svg"
              alt="Farmacias de Turno"
              width={64}
              height={64}
              className="h-9 w-9"
              priority
            />
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">San Nicolás</span>
        </nav>
      </div>

      <main className="flex-1 container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-balance leading-tight">
              Farmacias de turno hoy en San Nicolás de los Arroyos
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base py-1.5 px-3">
                <Clock className="w-4 h-4 mr-1.5" />
                {currentDate.dateString}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">Estas son las farmacias que están de turno hoy.</p>
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
                      city: "San Nicolás de los Arroyos, Buenos Aires",
                      phone: x.telefono ?? "",
                      hours: `Turno (24 hs): Desde ${formatARDateTime(x.inicio_turno)} → hasta ${formatARDateTime(x.fin_turno)}`,
                      notes: x.notas ?? undefined,
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
                      Hoy no hay farmacias de turno registradas para San Nicolás. Por favor, consultá más tarde o
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
                      city: "San Nicolás de los Arroyos, Buenos Aires",
                      phone: x.telefono ?? "",
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
