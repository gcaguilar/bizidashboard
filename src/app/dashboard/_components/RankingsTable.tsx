import type { RankingsResponse } from '@/lib/api';

type RankingsTableProps = {
  rankings: {
    turnover: RankingsResponse;
    availability: RankingsResponse;
  };
};

export function RankingsTable({ rankings }: RankingsTableProps) {
  const turnoverRows = rankings.turnover.rankings.slice(0, 5);
  const availabilityRows = rankings.availability.rankings.slice(0, 5);

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Rankings destacados
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Comparativa de rotacion y disponibilidad reciente.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Mas rotacion
          </p>
          <table className="mt-2 w-full text-xs">
            <thead className="text-[var(--muted)]">
              <tr className="text-left">
                <th className="py-1">Estacion</th>
                <th className="py-1 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {turnoverRows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-2 text-[var(--muted)]">
                    Sin datos
                  </td>
                </tr>
              ) : (
                turnoverRows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="py-2">{row.stationId}</td>
                    <td className="py-2 text-right">
                      {row.turnoverScore.toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-[var(--border)] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Problemas de disponibilidad
          </p>
          <table className="mt-2 w-full text-xs">
            <thead className="text-[var(--muted)]">
              <tr className="text-left">
                <th className="py-1">Estacion</th>
                <th className="py-1 text-right">Horas vacia</th>
              </tr>
            </thead>
            <tbody>
              {availabilityRows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-2 text-[var(--muted)]">
                    Sin datos
                  </td>
                </tr>
              ) : (
                availabilityRows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="py-2">{row.stationId}</td>
                    <td className="py-2 text-right">{row.emptyHours}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
