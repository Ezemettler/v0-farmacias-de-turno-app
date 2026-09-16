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

// Relación explícita por ciudad (no clusters simétricos) para el módulo
// de "localidades cercanas" — máximo 2-3 por ciudad, solo las
// verdaderamente pegadas. Zona oeste GBA se dividió en dos partidos
// reales en vez de un cluster único de 6: Morón/Castelar/Haedo (Partido
// de Morón) por un lado, Hurlingham/Villa Tesei/Ituzaingó por otro —
// confirmado con el usuario que Hurlingham/Ituzaingó quedan más lejos
// de Morón como para listarlas ahí. No hay fallback para ciudades sin
// vecinas reales — el módulo no se muestra en esos casos.
const RELACIONES: Record<string, string[]> = {
  moron: ["castelar", "haedo"],
  castelar: ["moron", "haedo"],
  haedo: ["moron", "castelar"],
  hurlingham: ["villa-tesei", "ituzaingo"],
  "villa-tesei": ["hurlingham", "ituzaingo"],
  ituzaingo: ["villa-tesei", "hurlingham"],
  berazategui: ["platanos", "hudson"],
  platanos: ["berazategui", "hudson"],
  hudson: ["berazategui", "platanos"],
  "la-plata": ["los-hornos"],
  "los-hornos": ["la-plata"],
  "santa-fe": ["santo-tome"],
  "santo-tome": ["santa-fe"],
}

export function getCiudadesRelacionadas(slug: string): City[] {
  const relacionados = RELACIONES[slug]
  if (!relacionados) return []

  return relacionados
    .map((s) => CITIES.find((c) => c.slug === s))
    .filter((c): c is City => c !== undefined)
}
