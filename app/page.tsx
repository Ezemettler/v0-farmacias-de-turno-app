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
          <Link href="/" className="inline-flex items-center gap-2 w-fit">
            <Image
              src="/app-icon-farmacias-de-turno.svg"
              alt=""
              width={512}
              height={512}
              className="h-8 w-8"
              priority
            />
            <span className="text-xl font-semibold">Farmacias de Turno</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <Image
                src="/app-icon-farmacias-de-turno.svg"
                alt=""
                width={512}
                height={512}
                className="h-12 w-12 md:h-16 md:w-16 shrink-0"
                priority
              />
              <h1 className="text-3xl md:text-5xl font-bold text-balance leading-tight text-center">
                Farmacias de turno hoy en Argentina
              </h1>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty text-center">
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
