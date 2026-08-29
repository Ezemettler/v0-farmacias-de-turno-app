import Link from "next/link"
import Image from "next/image"
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
        <div className="container mx-auto px-4 py-3">
          <Link href="/" className="inline-flex items-center w-fit">
            <Image
              src="/logo-farmacias-de-turno-simple.png"
              alt="Farmacias de Turno"
              width={1029}
              height={252}
              className="h-9 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <Image
              src="/logo-farmacias-de-turno.png"
              alt="Farmacias de Turno — Argentina, hoy"
              width={1188}
              height={318}
              className="h-16 md:h-20 w-auto mx-auto"
              priority
            />
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
