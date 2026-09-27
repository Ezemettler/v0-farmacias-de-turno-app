// Reglas de normalización de dirección para el link de Google Maps,
// afinadas a mano contra casos reales a lo largo de varias ciudades
// (ver historial de commits de components/pharmacy-card.tsx, de donde
// se extrajo esta función). Compartida entre la tarjeta de farmacia
// (link visible) y el schema JSON-LD (campo hasMap) para no duplicar
// estas reglas en dos lugares.
const DIRECCION_MAPS_OVERRIDES: Record<string, string> = {
  "Av. Kirchner (ex Mitre) e/49A y 50":
    "Av Mitre 4986, B1861 Guillermo Enrique Hudson, Provincia de Buenos Aires",
}

export function buildMapsUrl(address: string, city?: string): string {
  const direccionOverride = DIRECCION_MAPS_OVERRIDES[address.trim()]

  // Algunas fuentes (ej. Berazategui) agregan el barrio dentro de la
  // dirección con el formato "B. NombreBarrio" (ej. "128 y 55 B.
  // Marítimo"). Sumado a la ciudad que ya agregamos abajo, esto
  // sobre-especifica la búsqueda y hace que el geocoder de Google no
  // encuentre el punto (confirmado a mano: sin "B. Marítimo" sí lo
  // encuentra). Se saca solo para el link de Maps — la dirección visible
  // en la tarjeta queda intacta, es información útil para el usuario.
  let direccionParaMaps = direccionOverride ?? address.replace(/\s+B\.\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ]*$/, "")

  if (!direccionOverride) {
    // Igual que "calle + altura ignora la esquina" (regla ya confirmada más
    // abajo), pero para el formato "Calle 2975 entre X y Y" con nombres de
    // calle en vez de números — la altura ya alcanza para ubicar el punto,
    // la referencia de entrecalles sobra y confunde al geocoder.
    direccionParaMaps = direccionParaMaps.replace(/(\d+[A-Za-z]?)\s+(?:entre|e\/)\s+.+$/i, "$1")
  }

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
      : city
        ? `${direccionParaMaps}, ${city}, Argentina`
        : `${direccionParaMaps}, Argentina`
  )
  return `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`
}
