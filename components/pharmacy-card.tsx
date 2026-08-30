"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Clock, AlertCircle } from "lucide-react"
import type { Pharmacy } from "@/lib/data"

interface PharmacyCardProps {
  pharmacy: Pharmacy
  isOnDuty: boolean
}

function hasValue(v: unknown) {
  return v !== null && v !== undefined && String(v).trim() !== ""
}

export function PharmacyCard({ pharmacy, isOnDuty }: PharmacyCardProps) {
  const phone = hasValue(pharmacy.phone) ? String(pharmacy.phone).trim() : ""
  const hours =
    hasValue((pharmacy as any).hours) ? String((pharmacy as any).hours).trim()
    : hasValue(pharmacy.dutyHours) ? String(pharmacy.dutyHours).trim()
    : ""
  const notes = hasValue(pharmacy.notes) ? String(pharmacy.notes).trim() : ""

  // La dirección suele ser solo calle y número (ej. "Maipú y Lavalle"),
  // sin ciudad — sin el nombre de la ciudad, Maps puede resolverla en
  // cualquier provincia de Argentina. Se concatena acá para desambiguar.
  const mapsQuery = encodeURIComponent(
    pharmacy.city ? `${pharmacy.address}, ${pharmacy.city}, Argentina` : `${pharmacy.address}, Argentina`
  )
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  const handleCall = () => {
    if (!phone) return
    window.location.href = `tel:${phone}`
  }

  return (
    <Card className={isOnDuty ? "border-2 border-accent shadow-md py-4" : "border-muted py-4"}>
      <CardHeader className="gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg md:text-xl truncate">{pharmacy.name}</CardTitle>
          <Button asChild size="sm" className="shrink-0">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-4 h-4 mr-1.5" />
              Ver en Maps
            </a>
          </Button>
        </div>

        {isOnDuty && <Badge className="bg-accent text-accent-foreground w-fit">De turno ahora</Badge>}

        <CardDescription className="space-y-1.5 text-sm md:text-base">
          {/* Dirección */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-foreground transition-colors"
            >
              {pharmacy.address}
            </a>
          </div>

          {/* Teléfono (solo si hay) */}
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <a href={`tel:${phone}`} className="hover:underline hover:text-foreground transition-colors">
                {phone}
              </a>
            </div>
          )}

          {/* el horario solo se ve en las tarjetas “De turno hoy” */}
          {isOnDuty && hours && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{hours}</span>
            </div>
          )}

          {/* Notas (solo si hay) */}
          {notes && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{notes}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
