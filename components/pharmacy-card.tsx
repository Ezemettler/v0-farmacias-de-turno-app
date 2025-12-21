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

export function PharmacyCard({ pharmacy, isOnDuty }: PharmacyCardProps) {
  const handleCall = () => {
    window.location.href = `tel:${pharmacy.phone}`
  }

  const mapsQuery = encodeURIComponent(`${pharmacy.address}, ${pharmacy.city}, Argentina`)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  return (
    <Card className={isOnDuty ? "border-2 border-accent shadow-md" : "border-muted"}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl md:text-2xl mb-2">{pharmacy.name}</CardTitle>
            {isOnDuty && <Badge className="bg-accent text-accent-foreground mb-2">De turno hoy</Badge>}
            <CardDescription className="space-y-2 text-base">
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
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href={`tel:${pharmacy.phone}`} className="hover:underline hover:text-foreground transition-colors">
                  {pharmacy.phone}
                </a>
              </div>
              {pharmacy.dutyHours && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{pharmacy.dutyHours}</span>
                </div>
              )}
              {pharmacy.notes && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{pharmacy.notes}</span>
                </div>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isOnDuty && (
          <Button size="lg" className="w-full md:w-auto text-lg py-6" onClick={handleCall}>
            <Phone className="w-5 h-5 mr-2" />
            Llamar ahora
          </Button>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <MapPin className="w-4 h-4" />
          Ver en Maps
        </a>
      </CardContent>
    </Card>
  )
}
