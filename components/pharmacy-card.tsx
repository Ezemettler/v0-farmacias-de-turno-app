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

  // Algunas fuentes (ej. Berazategui) agregan el barrio dentro de la
  // dirección con el formato "B. NombreBarrio" (ej. "128 y 55 B.
  // Marítimo"). Sumado a la ciudad que ya agregamos abajo, esto
  // sobre-especifica la búsqueda y hace que el geocoder de Google no
  // encuentre el punto (confirmado a mano: sin "B. Marítimo" sí lo
  // encuentra). Se saca solo para el link de Maps — la dirección visible
  // en la tarjeta queda intacta, es información útil para el usuario.
  let direccionParaMaps = pharmacy.address.replace(/\s+B\.\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ]*$/, "")

  // Direcciones tipo "128 y 55" (solo dos números, sistema de calles
  // numeradas de La Plata/Berazategui) tampoco geocodifican bien así
  // nomás — confirmado a mano que "C. 128 & C. 55" sí funciona, "128 y
  // 55" no. Google necesita la palabra "Calle" (abreviada) para saber
  // que son nombres de calle y no otra cosa.
  direccionParaMaps = direccionParaMaps.replace(
    /^(\d+[A-Za-z]?)\s+y\s+(\d+[A-Za-z]?)$/,
    "C. $1 & C. $2"
  )

  // "Av. Kirchner (ex Mitre)" (Berazategui/Hudson): el paréntesis con el
  // nombre viejo es ruido para el geocoder, y el nombre corto "Kirchner"
  // no siempre alcanza — el mapa la tiene cargada con el nombre oficial
  // completo "Avenida Presidente Néstor Kirchner".
  direccionParaMaps = direccionParaMaps.replace(
    /Av\.\s*Kirchner\s*\(ex\s+Mitre\)/i,
    "Avenida Presidente Néstor Kirchner"
  )

  // Direcciones tipo "Calle e/49A y 50" (entre calle A y calle B): una
  // intersección de tres calles en la búsqueda confunde al geocoder. Se
  // simplifica al cruce con la primera transversal, mismo formato "Calle
  // & Calle" que ya funciona para intersecciones numeradas. NOTA: a
  // diferencia del caso de arriba, esto todavía no está confirmado a
  // mano en Google Maps — es la mejor hipótesis con la info disponible.
  direccionParaMaps = direccionParaMaps.replace(
    /\s+e\/(\d+[A-Za-z]?)\s+y\s+\d+[A-Za-z]?$/,
    " esq. C. $1"
  )

  // La dirección suele ser solo calle y número (ej. "Maipú y Lavalle"),
  // sin ciudad — sin el nombre de la ciudad, Maps puede resolverla en
  // cualquier provincia de Argentina. Se concatena acá para desambiguar.
  const mapsQuery = encodeURIComponent(
    pharmacy.city ? `${direccionParaMaps}, ${pharmacy.city}, Argentina` : `${direccionParaMaps}, Argentina`
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
