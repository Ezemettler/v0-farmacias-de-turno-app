// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";

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

export async function GET() {
  const baseUrl = "https://farmaciasdeturno.vercel.app";
  const lastmod = new Date().toISOString();

  const urls = [
    { loc: `${baseUrl}/`, lastmod },
    { loc: `${baseUrl}/san-nicolas`, lastmod },
    { loc: `${baseUrl}/san-fernando`, lastmod },
    { loc: `${baseUrl}/santa-rosa`, lastmod },
  ];

  const xml = buildSitemap(urls);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600", // 1h en edge cache
    },
  });
}
