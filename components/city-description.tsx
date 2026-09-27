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
      {cityName} cuenta con {cantidadFarmacias} farmacia{cantidadFarmacias === 1 ? "" : "s"} registrada
      {cantidadFarmacias === 1 ? "" : "s"} en el sistema de turnos rotativos. Todos los días, a partir de
      las {horaInicio} hs, una o más farmacias quedan de guardia durante 24 horas para atender consultas
      y emergencias fuera del horario comercial habitual, hasta que el turno pasa a la siguiente farmacia
      del cronograma al día siguiente a la misma hora. Esta página se actualiza automáticamente con la
      farmacia de turno vigente en {cityName} en este momento — nombre, dirección, teléfono (cuando está
      disponible) y un enlace directo a Google Maps para llegar sin vueltas. Antes de trasladarte, sobre
      todo de madrugada o en fin de semana, te recomendamos llamar primero para confirmar que tienen el
      medicamento que necesitás, ya que el stock puede variar de una farmacia a otra.
    </p>
  )
}
