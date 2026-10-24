// Párrafo introductorio único por ciudad, con datos reales (no relleno
// genérico) — cantidad de farmacias registradas y horario de rotación
// del turno. Se ubica arriba de "Disponibles ahora", texto visible sin
// ocultar por CSS.
export function CityDescription({
  cityName,
  cantidadFarmacias,
  horaInicio,
}: {
  cityName: string
  cantidadFarmacias: number
  horaInicio: string
}) {
  return (
    <p className="text-muted-foreground text-pretty leading-relaxed">
      {cityName} cuenta con {cantidadFarmacias} farmacia{cantidadFarmacias === 1 ? "" : "s"} de turno
      registrada{cantidadFarmacias === 1 ? "" : "s"}. Todos los días, a partir de las {horaInicio} hs, una
      o más farmacias quedan de guardia durante 24 horas para atender consultas y emergencias.
    </p>
  )
}
