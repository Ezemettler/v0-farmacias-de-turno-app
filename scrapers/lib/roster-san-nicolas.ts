// Padrón fijo de farmacias de turno de San Nicolás, por letra de turno.
// Copia de telegram-bot/lib/turnos-san-nicolas.ts (workspaces separados,
// sin import compartido) — si el Colegio de Farmacéuticos cambia el
// padrón, actualizar en los dos lugares. Confirmado a mano contra
// capturas del Colegio (agosto 2026): cada letra es siempre el mismo
// grupo de farmacias, sin importar la fecha en la que caiga.
export interface FarmaciaTurno {
  nombre: string
  direccion: string
}

export const ROSTER_SAN_NICOLAS: Record<string, FarmaciaTurno[]> = {
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
