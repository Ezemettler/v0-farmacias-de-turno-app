import Link from "next/link"
import { CITIES } from "@/lib/cities"

// Enlazado interno real (<a href> visible en el HTML crudo, sin depender
// de JS) hacia el resto de las ciudades con farmacia de turno vigente
// hoy. Objetivo: que Google pueda descubrir y rastrear todas las páginas
// del sitio navegando desde cualquier ciudad, no solo desde la home.
// Ciudades sin datos hoy (ej. scraper caído) se excluyen para no linkear
// a una página vacía. ciudadesConDatos se resuelve en la página (ya
// hace otras consultas a Supabase ahí) para mantener este componente
// sincrónico, igual que NearbyCities y CityDescription.
export function OtherCitiesLinks({
  currentSlug,
  ciudadesConDatos,
}: {
  currentSlug: string
  ciudadesConDatos: string[]
}) {
  const otrasCiudades = CITIES.filter(
    (c) => c.slug !== currentSlug && ciudadesConDatos.includes(c.slug)
  )

  if (otrasCiudades.length === 0) return null

  return (
    <section className="space-y-3 pt-4">
      <h2 className="text-xl font-bold">Farmacias de turno en otras ciudades</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        {otrasCiudades.map((ciudad) => (
          <Link key={ciudad.slug} href={`/${ciudad.slug}`} className="text-primary hover:underline">
            Farmacias de turno en {ciudad.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
