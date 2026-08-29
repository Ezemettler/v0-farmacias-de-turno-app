"use client"

import { useState } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { MapPin, Search } from "lucide-react"

type City = {
  name: string
  slug: string
  province: string
}

export function CitySearch({ cities }: { cities: City[] }) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCities = cities.filter((city) => city.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar ciudad..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
        />
      </div>

      {filteredCities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No se encontraron ciudades</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCities.map((city) => (
            <Link key={city.slug} href={`/${city.slug}`} className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary py-4">
                <CardHeader className="gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 min-w-0 text-base">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{city.name}</span>
                    </CardTitle>
                    <Button size="sm" className="shrink-0">
                      Ver turnos
                    </Button>
                  </div>
                  <CardDescription className="text-xs">{city.province}, Argentina</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
