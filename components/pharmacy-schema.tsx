import { buildMapsUrl } from "@/lib/maps-url"
import type { TurnoRow } from "@/lib/turno-utils"

// Schema.org JSON-LD (tipo Pharmacy) para las farmacias de turno
// listadas en la página — no afecta si Google indexa o no la página,
// solo cómo se puede mostrar el resultado (rich snippets). Un <script>
// por página con un array de entidades Pharmacy, una por farmacia.
export function PharmacySchema({
  pharmacies,
  cityName,
  province,
}: {
  pharmacies: TurnoRow[]
  cityName: string
  province: string
}) {
  if (pharmacies.length === 0) return null

  const items = pharmacies.map((p) => ({
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: p.nombre_farmacia,
    address: {
      "@type": "PostalAddress",
      streetAddress: p.direccion,
      addressLocality: cityName,
      addressRegion: province,
      addressCountry: "AR",
    },
    ...(p.telefono ? { telephone: p.telefono } : {}),
    hasMap: buildMapsUrl(p.direccion, `${cityName}, ${province}`),
    // Fecha real en la que este turno entró en vigencia — no la fecha
    // de build/deploy, así Google ve que el dato se actualiza de
    // verdad día a día y no un valor fijo que nunca cambia.
    ...(p.inicio_turno ? { dateModified: p.inicio_turno.slice(0, 10) } : {}),
  }))

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(items) }}
    />
  )
}
