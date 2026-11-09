// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { CITIES } from "@/lib/cities";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

function buildSitemap(urls: { loc: string; lastmod?: string }[]) {
  const items = urls
    .map(
      (u) => `
  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;
}

// lastmod real por ciudad — la fecha del turno vigente más reciente
// que se cargó, no la hora en la que alguien pidió el sitemap. Antes
// era siempre "ahora" en las 22 URLs por igual, una señal de
// frescura que no decía nada real.
async function obtenerUltimaActualizacionPorCiudad(): Promise<Map<string, string>> {
  const hace60Dias = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("farmacias_turno")
    .select("ciudad_slug, inicio_turno")
    .gte("inicio_turno", hace60Dias)
    .order("inicio_turno", { ascending: false });

  const resultado = new Map<string, string>();
  if (error || !data) return resultado;

  for (const row of data as { ciudad_slug: string; inicio_turno: string | null }[]) {
    if (!row.ciudad_slug || !row.inicio_turno) continue;
    if (!resultado.has(row.ciudad_slug)) {
      resultado.set(row.ciudad_slug, row.inicio_turno.slice(0, 10));
    }
  }
  return resultado;
}

export async function GET() {
  const baseUrl = "https://farmaciasdeturnoar.com";
  const ultimaPorCiudad = await obtenerUltimaActualizacionPorCiudad();
  const masReciente =
    [...ultimaPorCiudad.values()].sort().at(-1) ?? new Date().toISOString().slice(0, 10);

  const urls = [
    { loc: `${baseUrl}/`, lastmod: masReciente },
    ...CITIES.map((c) => ({
      loc: `${baseUrl}/${c.slug}`,
      lastmod: ultimaPorCiudad.get(c.slug) ?? masReciente,
    })),
  ];

  const xml = buildSitemap(urls);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600", // 1h en edge cache
    },
  });
}
