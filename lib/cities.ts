export interface City {
  name: string
  slug: string
  province: string
}

// Fuente única de las 22 ciudades del sitio — usada por el home, el
// sitemap y el módulo de localidades cercanas. Agregar una ciudad acá
// alcanza para que aparezca en los tres lugares.
export const CITIES: City[] = [
  { name: "San Nicolás de los Arroyos", slug: "san-nicolas", province: "Buenos Aires" },
  { name: "San Pedro", slug: "san-pedro", province: "Buenos Aires" },
  { name: "Santa Rosa", slug: "santa-rosa", province: "La Pampa" },
  { name: "General Pico", slug: "general-pico", province: "La Pampa" },
  { name: "San Fernando", slug: "san-fernando", province: "Buenos Aires" },
  { name: "San Rafael", slug: "san-rafael", province: "Mendoza" },
  { name: "Venado Tuerto", slug: "venado-tuerto", province: "Santa Fe" },
  { name: "La Plata", slug: "la-plata", province: "Buenos Aires" },
  { name: "Los Hornos", slug: "los-hornos", province: "Buenos Aires" },
  { name: "Berazategui", slug: "berazategui", province: "Buenos Aires" },
  { name: "Plátanos", slug: "platanos", province: "Buenos Aires" },
  { name: "Hudson", slug: "hudson", province: "Buenos Aires" },
  { name: "Santa Fe", slug: "santa-fe", province: "Santa Fe" },
  { name: "Santo Tomé", slug: "santo-tome", province: "Santa Fe" },
  { name: "Río Grande", slug: "rio-grande", province: "Tierra del Fuego" },
  { name: "Ushuaia", slug: "ushuaia", province: "Tierra del Fuego" },
  { name: "Morón", slug: "moron", province: "Buenos Aires" },
  { name: "Castelar", slug: "castelar", province: "Buenos Aires" },
  { name: "Haedo", slug: "haedo", province: "Buenos Aires" },
  { name: "Hurlingham", slug: "hurlingham", province: "Buenos Aires" },
  { name: "Ituzaingó", slug: "ituzaingo", province: "Buenos Aires" },
  { name: "Villa Tesei", slug: "villa-tesei", province: "Buenos Aires" },
]

// Agrupa ciudades geográficamente vecinas DE VERDAD (radio ~30km), para
// el módulo de "localidades cercanas" de cada página de ciudad. No hay
// fallback para ciudades sin vecinas reales en el sitio — el módulo
// simplemente no se muestra en esos casos, en vez de forzar una
// cercanía que no existe (confirmado con el usuario: mostrar ciudades a
// cientos/miles de km no le sirve a nadie).
//
// Descartados a propósito por no cumplir el radio, pese a estar en la
// misma provincia: Santa Rosa-General Pico (~110km), Río Grande-Ushuaia
// (~200km), San Nicolás-San Pedro (~40km, ligeramente por encima del
// límite — a confirmar si se quiere sumar más adelante).
const CLUSTERS_GEOGRAFICOS: string[][] = [
  ["moron", "castelar", "haedo", "hurlingham", "ituzaingo", "villa-tesei"], // zona oeste GBA
  ["berazategui", "platanos", "hudson"], // partido de Berazategui
  ["la-plata", "los-hornos"],
  ["santa-fe", "santo-tome"],
]

export function getCiudadesRelacionadas(slug: string): City[] {
  const cluster = CLUSTERS_GEOGRAFICOS.find((grupo) => grupo.includes(slug))
  if (!cluster) return []

  return cluster
    .filter((s) => s !== slug)
    .map((s) => CITIES.find((c) => c.slug === s))
    .filter((c): c is City => c !== undefined)
}
