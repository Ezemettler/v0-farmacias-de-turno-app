import { MapPin } from "lucide-react"
import type { Metadata } from "next"
import { CitySearch } from "@/components/city-search"

export const metadata: Metadata = {
  title: "Farmacias de turno hoy en Argentina | Web farmacias de turno",
  description:
    "Encontrá farmacias abiertas hoy en tu ciudad. Información actualizada de farmacias de turno en Argentina.",
}

export default function HomePage() {
  const cities = [
    {
      name: "San Nicolás de los Arroyos",
      slug: "san-nicolas",
      province: "Buenos Aires",
    },
    {
      name: "San Pedro",
      slug: "san-pedro",
      province: "Buenos Aires",
    },
    {
      name: "Santa Rosa",
      slug: "santa-rosa",
      province: "La Pampa",
    },
    {
      name: "General Pico",
      slug: "general-pico",
      province: "La Pampa",
    },
    {
      name: "San Fernando",
      slug: "san-fernando",
      province: "Buenos Aires",
    },
    {
      name: "San Rafael",
      slug: "san-rafael",
      province: "Mendoza",
    },
    {
      name: "Venado Tuerto",
      slug: "venado-tuerto",
      province: "Santa Fe",
    },
  ]

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

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-balance leading-tight">
              Farmacias de turno hoy en Argentina
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty">
              Encontrá farmacias abiertas hoy, por ciudad, con información clara y actualizada.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Seleccioná tu ciudad</h2>
            <CitySearch cities={cities} />
          </div>
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
