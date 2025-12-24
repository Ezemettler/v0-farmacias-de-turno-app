import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MapPin } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Farmacias de turno hoy en Argentina | Web farmacias de turno",
  description:
    "Encontrá farmacias abiertas hoy en tu ciudad. Información clara y actualizada de farmacias de turno en Argentina.",
}

export default function HomePage() {
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

            <Link href="/san-nicolas" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>San Nicolás de los Arroyos</span>
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Buenos Aires, Argentina</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full md:w-auto" size="lg">
                    Ver farmacias de turno hoy
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/santa-rosa" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Santa Rosa</span>
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>La Pampa, Argentina</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full md:w-auto" size="lg">
                    Ver farmacias de turno hoy
                  </Button>
                </CardContent>
              </Card>
            </Link>

                        <Link href="/santa-rosa" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>San Fernando</span>
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Buenos Aires, Argentina</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full md:w-auto" size="lg">
                    Ver farmacias de turno hoy
                  </Button>
                </CardContent>
              </Card>
            </Link>
            
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
