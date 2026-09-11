import Link from "next/link"
import { MapPin } from "lucide-react"
import { getCiudadesRelacionadas } from "@/lib/cities"

// Next.js renderiza <Link> como un <a href> normal en el HTML — Google
// lo rastrea igual que un link nativo, con la ventaja de navegación sin
// recarga completa para el usuario.
export function NearbyCities({ currentSlug }: { currentSlug: string }) {
  const ciudades = getCiudadesRelacionadas(currentSlug)

  if (ciudades.length === 0) return null

  return (
    <section className="space-y-3 pt-4">
      <h2 className="text-xl font-bold">Farmacias de turno en localidades cercanas</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ciudades.map((ciudad) => (
          <Link
            key={ciudad.slug}
            href={`/${ciudad.slug}`}
            className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:border-primary hover:bg-muted/50 transition-colors"
          >
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">{ciudad.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
