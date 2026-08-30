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

  // Casos puntuales donde la dirección de la fuente (formato "entre
  // calle A y calle B", sin altura) no alcanza para que Google la
  // geocodifique y no hay una regla general que lo resuelva — la altura
  // real no se puede derivar de "e/49A y 50" por fórmula. Se confirmó a
  // mano la dirección real que sí encuentra el punto correcto.
  const DIRECCION_MAPS_OVERRIDES: Record<string, string> = {
    "Av. Kirchner (ex Mitre) e/49A y 50":
      "Av Mitre 4986, B1861 Guillermo Enrique Hudson, Provincia de Buenos Aires",
  }
  const direccionOverride = DIRECCION_MAPS_OVERRIDES[pharmacy.address.trim()]

  // Algunas fuentes (ej. Berazategui) agregan el barrio dentro de la
  // dirección con el formato "B. NombreBarrio" (ej. "128 y 55 B.
  // Marítimo"). Sumado a la ciudad que ya agregamos abajo, esto
  // sobre-especifica la búsqueda y hace que el geocoder de Google no
  // encuentre el punto (confirmado a mano: sin "B. Marítimo" sí lo
  // encuentra). Se saca solo para el link de Maps — la dirección visible
  // en la tarjeta queda intacta, es información útil para el usuario.
  let direccionParaMaps = direccionOverride ?? pharmacy.address.replace(/\s+B\.\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ]*$/, "")

  if (!direccionOverride) {
    // Sistema de calles numeradas (La Plata/Berazategui/Los Hornos): la
    // fuente suele agregar la esquina o las entrecalles ("esq 8", "e/154
    // y 155") además de la altura ("Nro2971", "nro 654"). Confirmado a
    // mano: cuando la dirección tiene calle + altura, Google la ubica
    // bien solo con esas dos cosas — la esquina/entrecalles de más hace
    // que no encuentre el punto, así que se descartan para el link.
    const alturaMatch = direccionParaMaps.match(/\bn(?:ro\.?|[°º]\.?)\s*(\d+)/i)
    if (alturaMatch) {
      let calle = direccionParaMaps.slice(0, alturaMatch.index).trim()
      calle = calle.replace(/\s+esq(?:uina)?\.?\s+.*$/i, "")
      calle = calle.replace(/^(?:Av\.?|Avenida)\s+(\d+[A-Za-z]?)$/i, "C. $1")
      calle = calle.replace(/^(\d+[A-Za-z]?)$/, "C. $1")
      direccionParaMaps = `${calle} ${alturaMatch[1]}`
    } else {
      // Sin altura, es una esquina pura (ej. "128 y 55", "Cno. Gral.
      // Belgrano y 25") — confirmado a mano que agregar "Calle" a la
      // transversal numérica y "&" en vez de "y" es lo que hace que
      // Google la encuentre.
      direccionParaMaps = direccionParaMaps.replace(
        /^(.+?)\s+y\s+(\d+[A-Za-z]?)$/,
        (_match, calle1: string, calle2: string) => {
          const calle1Norm = /^\d+[A-Za-z]?$/.test(calle1.trim()) ? `C. ${calle1.trim()}` : calle1.trim()
          return `${calle1Norm} & C. ${calle2}`
        }
      )
    }
  }

  // La dirección suele ser solo calle y número (ej. "Maipú y Lavalle"),
  // sin ciudad — sin el nombre de la ciudad, Maps puede resolverla en
  // cualquier provincia de Argentina. Se concatena acá para desambiguar.
  // Si hay override, ya viene con localidad y provincia incluidas.
  const mapsQuery = encodeURIComponent(
    direccionOverride
      ? `${direccionParaMaps}, Argentina`
      : pharmacy.city
        ? `${direccionParaMaps}, ${pharmacy.city}, Argentina`
        : `${direccionParaMaps}, Argentina`
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
