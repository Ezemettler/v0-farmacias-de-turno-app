"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Como tu address ya incluye ciudad/provincia, alcanza con esto.
  const mapsQuery = encodeURIComponent(`${pharmacy.address}, Argentina`)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  const handleCall = () => {
    if (!phone) return
    window.location.href = `tel:${phone}`
  }

  return (
    <Card className={isOnDuty ? "border-2 border-accent shadow-md" : "border-muted"}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl md:text-2xl mb-2">{pharmacy.name}</CardTitle>

            {isOnDuty && <Badge className="bg-accent text-accent-foreground mb-2">De turno hoy</Badge>}

            <CardDescription className="space-y-2 text-base">
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Botón llamar SOLO si está de turno y hay teléfono */}
        {isOnDuty && (
          <Button
            asChild
            size="lg"
            className="w-full md:w-auto text-lg py-6"
          >
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-5 h-5 mr-2" />
              Ver en Maps
            </a>
          </Button>
        )}

      </CardContent>
    </Card>
  )
}
