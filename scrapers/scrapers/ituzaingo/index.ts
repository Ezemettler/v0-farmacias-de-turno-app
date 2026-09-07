import { hoyArgentinaYYYYMMDD, parseARTimeToISO, siguienteDia } from "../../lib/fecha.js"
import { logger } from "../../lib/logger.js"
import type { ICityScraper, ScrapedTurno, ScraperResult } from "../../lib/types.js"

// Ituzaingó, Buenos Aires — mismo sistema que Morón/Castelar/Haedo/
// Hurlingham (ver scrapers/scrapers/moron/index.ts), acá con 15 grupos
// (A-O). Confirmado a mano contra los calendarios de septiembre y
// octubre 2026 (61 días, cero excepciones): ciclo de 15 días. Se
// extiende hacia el futuro sin esperar confirmación mensual.
//
// La mayoría de los grupos tienen 3 farmacias propias + 2 fijas que se
// repiten siempre ("24 Hs. S.C.S." y "Nuevo Puente SCS"). Los Grupos I y
// J son la excepción confirmada por el usuario: no tienen esas 2 fijas
// (I tiene 4 farmacias propias, J tiene 3).
const FECHA_REFERENCIA = "2026-09-04" // confirmado a mano: Grupo A

const GRUPOS: Record<string, ScrapedTurno[]> = {
  A: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "LUKOMAZ 2", direccion: "Brandsen 998", telefono: "4624-2320" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "SAN ALBERTO", direccion: "Almagro 3122", telefono: "4481-4052" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "TORRADO", direccion: "Dr. Gelpi 897, Ituzaingó", telefono: "4264-8375" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  B: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "EL LUCERO", direccion: "Gervasio Pavón 3999", telefono: "4692-2048" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "LAVORATO", direccion: "Martín Fierro 4196", telefono: "4481-5400" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "OLAZÁBAL 1250", direccion: "Pte. Perón 9453/91 LOCAL B10", telefono: "7549-4486" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  C: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "CASANOVA", direccion: "Brandsen 2349", telefono: "4621-0506" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "CORAZZA", direccion: "José María Paz 1656", telefono: "4661-3093" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "MIGHETTI", direccion: "Soler 136", telefono: "4623-1994" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  D: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "LUIS", direccion: "Ratti 2001/2007", telefono: "4623-9211" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "DELLAMEA", direccion: "Almagro 3518", telefono: "4481-6495" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "GANDINI", direccion: "Domingo Olivera 2137", telefono: "4623-3713" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  E: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "DEL PUEBLO", direccion: "Av. Rivadavia 21824", telefono: "4458-5656" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "DONASCIMIENTO", direccion: "Brandsen 3674", telefono: "4621-1515" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "WAYAR", direccion: "Berlín 3925", telefono: "4692-1732" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  F: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "BRITO", direccion: "Fray Luis Beltran 2402", telefono: "4692-4020" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "LO CASCIO", direccion: "Posta de Pardo 2394", telefono: "4624-8886" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "OSSET", direccion: "Olavarría 298", telefono: "4623-8648" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  G: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "GASPARETTO", direccion: "Blas Parera 2002", telefono: "4692-1431" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "CENTRAL OESTE LELOIR", direccion: "Presidente Perón 8505", telefono: "4621-8818" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "MAGUIS S.C.S.", direccion: "N. Repetto 498", telefono: "4459-6323" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  H: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "GABILONDO", direccion: "Cipolletti 692", telefono: "4450-6087" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "GONZALEZ E.", direccion: "Int. Pérez Quintana 961", telefono: "4624-8710" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "SAMPEDRO", direccion: "Blas Parera 497", telefono: "4624-7932" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  I: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "FARMASOL", direccion: "José María Paz 1315", telefono: "4458-0362" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "MIGUEL ANGEL S.C.S.", direccion: "Brandsen 1971", telefono: "4623-0737" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "RIENDA", direccion: "Olivera 1699", telefono: "15-4043-6795" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "LUKOMAZ", direccion: "Defilippi 814", telefono: "4458-2725" },
  ],
  J: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "LA BOTICA", direccion: "Brandsen 1601", telefono: "4458-2932" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "VARGAS WAYAR", direccion: "Onofre Betbeder 3707", telefono: "11-5938-6024" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "QUIMEY", direccion: "Barcala 601", telefono: "4661-2727" },
  ],
  K: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "CENTRAL OESTE ITUZAINGO", direccion: "La Heras 361", telefono: "4624-5522" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "CASANGA", direccion: "Julián Balbín 3910", telefono: "4481-2803" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "MASSIMINO", direccion: "Ratti 1040", telefono: "4624-2039" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  L: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "GUZ-GON", direccion: "Pringles 1454", telefono: "4621-8976" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "MOROÑAS", direccion: "Cerrito 1802", telefono: "7514-9767" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "VARGAS WAYAR", direccion: "Fray Luis Beltran 1901", telefono: "4692-6664" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  M: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "LARA", direccion: "Williams Morris 3590", telefono: "4692-0029" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "JUNCAL S.C.S.", direccion: "Juncal 88", telefono: "4661-9548" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "LEIKIS", direccion: "Martín Fierro 4794", telefono: "4621-0524" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  N: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "AMALIA", direccion: "Las Heras 79", telefono: "4458-4862" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "FIGUEIRAS", direccion: "Pringles 2227", telefono: "4621-4304" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "ROSON", direccion: "Williams Morris 3194", telefono: "4692-0691" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
  O: [
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVA SAS S.S.C.", direccion: "Soler 79", telefono: "4661-4047" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "UDAONDO", direccion: "Patricias Mendocinas 678", telefono: "7530-1735" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "24 HS. S.C.S.", direccion: "Barcala 180", telefono: "4458-5825" },
    { ciudad_slug: "ituzaingo", fecha_turno: "", nombre_farmacia: "NUEVO PUENTE SCS", direccion: "Av. Gaona 6501", telefono: "4459-7871" },
  ],
}

const LETRAS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"]

export function predecirGrupoItuzaingo(fechaYYYYMMDD: string): string {
  const [y1, m1, d1] = FECHA_REFERENCIA.split("-").map(Number)
  const [y2, m2, d2] = fechaYYYYMMDD.split("-").map(Number)
  const ref = Date.UTC(y1, m1 - 1, d1)
  const objetivo = Date.UTC(y2, m2 - 1, d2)
  const diffDias = Math.round((objetivo - ref) / 86_400_000)
  const idx = ((diffDias % 15) + 15) % 15
  return LETRAS[idx]
}

export class ItuzaingoScraper implements ICityScraper {
  readonly ciudad_slug = "ituzaingo"
  readonly scraper_key = "central_oeste_calendario"

  async scrape(fechaAR?: string): Promise<ScraperResult> {
    const fecha = fechaAR ?? hoyArgentinaYYYYMMDD()
    const grupo = predecirGrupoItuzaingo(fecha)
    logger.info(`[ituzaingo] Grupo calculado para ${fecha}: ${grupo}`)

    const inicio_turno = parseARTimeToISO(fecha, "08:30")
    const fin_turno = parseARTimeToISO(siguienteDia(fecha), "08:30")

    const rows: ScrapedTurno[] = GRUPOS[grupo].map((f) => ({
      ...f,
      fecha_turno: fecha,
      inicio_turno,
      fin_turno,
    }))

    return {
      ciudad_slug: this.ciudad_slug,
      status: "success",
      rows,
      source_url: "calendario Central Oeste (calculado, sin fetch — ver comentario en el archivo)",
    }
  }
}

export const ituzaingoScraper = new ItuzaingoScraper()
