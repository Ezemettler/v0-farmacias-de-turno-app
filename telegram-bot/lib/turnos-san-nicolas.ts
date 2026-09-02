// Padrón fijo de farmacias de turno de San Nicolás, por letra de turno.
// Confirmado a mano contra capturas del Colegio de Farmacéuticos de San
// Nicolás (agosto 2026): cada letra es siempre el mismo grupo de
// farmacias, sin importar la fecha en la que caiga. Si el Colegio anuncia
// un cambio de padrón, esta lista hay que actualizarla a mano.
export interface FarmaciaTurno {
  nombre: string
  direccion: string
}

export const LETRAS_TURNO = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const
export type LetraTurno = (typeof LETRAS_TURNO)[number]

export const ROSTER_SAN_NICOLAS: Record<LetraTurno, FarmaciaTurno[]> = {
  A: [
    { nombre: "ARMELLINI", direccion: "Av. Central y 31 Oeste" },
    { nombre: "CABRERA", direccion: "Av. Falcón 222" },
    { nombre: "DIAMANTE", direccion: "Belgrano y Alvarez" },
    { nombre: "FURLAN", direccion: "9 de Julio 260" },
    { nombre: "GONZALEZ PACIN", direccion: "Nación 314" },
    { nombre: "HECTOR LOPEZ", direccion: "Maipú 794" },
  ],
  B: [
    { nombre: "CARRERA", direccion: "Almafuerte y España" },
    { nombre: "COCCARO", direccion: "Rivadavia 987 bis" },
    { nombre: "DEL PUEBLO", direccion: "Nación 450" },
    { nombre: "DOTTO", direccion: "Pringles y Alvear" },
    { nombre: "MELONE", direccion: "Pte. Perón 858" },
    { nombre: "TALJAME", direccion: "Av. Alberdi 346" },
  ],
  C: [
    { nombre: "AMEFARMA", direccion: "Mitre 200" },
    { nombre: "GARETTO", direccion: "Av. Morteo y España" },
    { nombre: "LILIANA LATORRE", direccion: "Ameghino 347" },
    { nombre: "PONCE", direccion: "Juramento 1445" },
    { nombre: "RASETTO", direccion: "Av. Viale 401" },
    { nombre: "SAN NICOLAS", direccion: "Cochabamba 357" },
  ],
  D: [
    { nombre: "BOFFA", direccion: "Av. Savio 1142" },
    { nombre: "CEJ", direccion: "Maipú 495" },
    { nombre: "DE LOS ARROYOS", direccion: "Nación 102" },
    { nombre: "LOMBARDI", direccion: "Av. Alberdi 548" },
    { nombre: "PORTA", direccion: "Av. Savio 147" },
    { nombre: "ROMERO", direccion: "Pte. Perón 1648" },
  ],
  E: [
    { nombre: "ALMADA", direccion: "Maipú y J. B. Justo" },
    { nombre: "CATALAN", direccion: "Almafuerte 442" },
    { nombre: "DE LA TORRE", direccion: "Av. Arturo Illia 643" },
    { nombre: "GIRARDI", direccion: "Av. Savio 1634" },
    { nombre: "HENRICH", direccion: "9 de Julio 63" },
    { nombre: "TONON", direccion: "Garibaldi 692" },
  ],
  F: [
    { nombre: "CANTONDEBAT", direccion: "Brown 598" },
    { nombre: "CAVARA", direccion: "Italia y Necochea" },
    { nombre: "FENIX", direccion: "Garibaldi 281" },
    { nombre: "FRATTINI", direccion: "Av. Moreno 108" },
    { nombre: "PRAT", direccion: "Pte. Perón 1093" },
    { nombre: "ZONTA", direccion: "Urquiza 422" },
  ],
  G: [
    { nombre: "BARBOTTI", direccion: "Bolívar y Necochea" },
    { nombre: "BRASESCO", direccion: "Av. Savio y Pombo" },
    { nombre: "CESARI", direccion: "Nación 183" },
    { nombre: "CONDE", direccion: "Nación 701" },
    { nombre: "GARAGUSO", direccion: "Belgrano 320" },
    { nombre: "PRINA", direccion: "Av. Arturo Illia 739" },
  ],
  H: [
    { nombre: "BLANCO", direccion: "Almafuerte y Benítez" },
    { nombre: "CORREA", direccion: "Italia 38" },
    { nombre: "DONATELLI", direccion: "Urquiza 499" },
    { nombre: "GAGLIARDO", direccion: "Pte. Perón 1035" },
    { nombre: "SALVADOR", direccion: "Av. Moreno 220" },
    { nombre: "TIONI", direccion: "Rademil y Alvear" },
    { nombre: "FARIAS", direccion: "Av. Savio 238" },
  ],
  I: [
    { nombre: "ALONSO", direccion: "Don Bosco y Pellegrini" },
    { nombre: "CIMINARI", direccion: "Av. Alberdi 699" },
    { nombre: "GARCIA", direccion: "Belgrano 184" },
    { nombre: "GOMEZ", direccion: "Pte. Perón 1366" },
    { nombre: "LEONE", direccion: "Bolívar 1053" },
    { nombre: "PZA. SARMIENTO", direccion: "España y Rivadavia" },
  ],
  J: [
    { nombre: "ALLUCHON", direccion: "Olleros 55" },
    { nombre: "BONGIORNO", direccion: "Francia y Av. Alberdi" },
    { nombre: "BRACCO", direccion: "Av. Savio 373" },
    { nombre: "FLOREANI", direccion: "Garibaldi y Alem" },
    { nombre: "PINASCO", direccion: "Alvear 95" },
    { nombre: "PRADO", direccion: "M. Cernadas 110" },
  ],
  K: [
    { nombre: "ANDRADA", direccion: "Av. Savio 601" },
    { nombre: "MA. INES LOPEZ", direccion: "L. Guruciaga 103" },
    { nombre: "MARTINELLI", direccion: "Av. Pte. Illia Nº 1127" },
    { nombre: "PALAU", direccion: "Av. Central 2215" },
    { nombre: "RADIUM", direccion: "Nación 352" },
    { nombre: "TONELLO", direccion: "Av. Falcón 651" },
  ],
  L: [
    { nombre: "BARONI", direccion: "Av. Irigoyen 1272 (B° Avamba'e)" },
    { nombre: "CAPRA", direccion: "Av. Moreno 466" },
    { nombre: "HEGOUABURU", direccion: "Mitre y Lamadrid" },
    { nombre: "MACCARONI", direccion: "Av. Savio 725" },
    { nombre: "MENNA", direccion: "Rivadavia 501" },
    { nombre: "PUCCIARELLI", direccion: "Lavalle 215 bis" },
  ],
}

export function esLetraTurnoValida(valor: string): valor is LetraTurno {
  return (LETRAS_TURNO as readonly string[]).includes(valor.toUpperCase())
}

// El turno rota en un ciclo fijo de 12 días (A→B→...→L→A), sin relación
// con el día de la semana. Confirmado contra 30 días seguidos de
// capturas (03/08 al 01/09/2026) sin una sola excepción, salvo el 1 y 2
// de agosto — probablemente un reordenamiento de padrón a inicio de mes.
// Por eso esto es solo una PREDICCIÓN informativa: nunca se usa para
// cargar datos sin que el operador confirme la letra real.
const FECHA_REFERENCIA = "2026-08-06" // confirmado a mano: Turno A

export function predecirLetraTurno(fechaYYYYMMDD: string): LetraTurno {
  const [y1, m1, d1] = FECHA_REFERENCIA.split("-").map(Number)
  const [y2, m2, d2] = fechaYYYYMMDD.split("-").map(Number)
  const ref = Date.UTC(y1, m1 - 1, d1)
  const objetivo = Date.UTC(y2, m2 - 1, d2)
  const diffDias = Math.round((objetivo - ref) / 86_400_000)
  const idx = ((diffDias % 12) + 12) % 12
  return LETRAS_TURNO[idx]
}
