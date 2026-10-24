import { PharmacyCard } from "@/components/pharmacy-card"
import type { TurnoRow } from "@/lib/turnos"
import { formatARDateTime } from "@/lib/turno-utils"

// Solo avisamos del próximo turno cuando falta poco — antes de esto no
// aporta nada útil y satura la página con información que no importa
// todavía.
const UMBRAL_MINUTOS = 60

function formatCountdown(minutos: number): string {
  if (minutos < 1) return "en instantes"
  if (minutos < 60) return `en ${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `en ${horas} h` : `en ${horas} h ${resto} min`
}

// Aviso de qué farmacia(s) toman la posta cuando falta menos de una
// hora para el cambio de turno — útil para no salir de casa justo
// cuando está por cerrar la de guardia actual. esPrediccion marca el
// caso de San Nicolás sin dato real cargado todavía (ver
// fetchProximoTurno en lib/turnos.ts).
export function NextShift({
  cityLabel,
  turnos,
  minutosHastaInicio,
  esPrediccion,
}: {
  cityLabel: string
  turnos: TurnoRow[]
  minutosHastaInicio: number
  esPrediccion: boolean
}) {
  if (turnos.length === 0 || minutosHastaInicio < 0 || minutosHastaInicio > UMBRAL_MINUTOS) return null

  const countdown = formatCountdown(minutosHastaInicio)

  return (
    <section className="space-y-3 pt-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Próximo turno</h2>
        <p className="text-sm text-muted-foreground">
          El turno cambia {countdown}
          {esPrediccion ? " (estimado)" : ""}.
        </p>
      </div>
      <div className="grid gap-3">
        {turnos.map((x, index) => (
          <PharmacyCard
            key={index}
            pharmacy={{
              name: x.nombre_farmacia,
              address: x.direccion,
              city: cityLabel,
              phone: x.telefono ?? "",
              hours: `Turno (24 hs): Desde ${formatARDateTime(x.inicio_turno)} → hasta ${formatARDateTime(x.fin_turno)}`,
              notes: x.notas ?? undefined,
            }}
            isOnDuty={true}
            dutyBadgeLabel={`De turno ${countdown}`}
          />
        ))}
      </div>
    </section>
  )
}
