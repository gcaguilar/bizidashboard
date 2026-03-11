'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { RankingsResponse, StationSnapshot } from '@/lib/api';
import { InfoHint } from './InfoHint';
import { formatPercent } from '@/lib/format';
import { calculateFrictionScore } from './useSystemMetrics';

type RankingsTableProps = {
  rankings: {
    turnover: RankingsResponse;
    availability: RankingsResponse;
  };
  stations: StationSnapshot[];
  density?: 'normal' | 'compact';
};

type RankingTab = 'turnover' | 'availability';

export function RankingsTable({ rankings, stations, density = 'normal' }: RankingsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('rankingTab');
  const activeTab: RankingTab =
    tabFromUrl === 'turnover' ? 'turnover' : 'availability'
  const search = searchParams.get('rankingSearch') ?? '';
  const showAll = searchParams.get('rankingShowAll') === '1';

  const updateQuery = (next: { tab?: RankingTab; search?: string; showAll?: boolean }) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const nextTab = next.tab ?? activeTab;
    const nextSearch = next.search ?? search;
    const nextShowAll = next.showAll ?? showAll;

    nextParams.set('rankingTab', nextTab);

    if (nextSearch.trim()) {
      nextParams.set('rankingSearch', nextSearch.trim());
    } else {
      nextParams.delete('rankingSearch');
    }

    if (nextShowAll) {
      nextParams.set('rankingShowAll', '1');
    } else {
      nextParams.delete('rankingShowAll');
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const stationMap = useMemo(() => {
    return new Map(stations.map((station) => [station.id, station]));
  }, [stations]);

  const rows = useMemo(() => {
    const activeRankings = rankings[activeTab]?.rankings ?? [];
    const normalizedSearch = search.trim().toLowerCase();

    const enriched = activeRankings.map((row) => {
      const station = stationMap.get(row.stationId);
      const problemHours = calculateFrictionScore(row.emptyHours, row.fullHours);
      const problemRate = row.totalHours > 0 ? (problemHours / row.totalHours) * 100 : 0;

      return {
        ...row,
        stationName: station?.name ?? row.stationId,
        stationCapacity: station?.capacity ?? 0,
        problemHours,
        problemRate,
      };
    });

    const filtered = normalizedSearch
      ? enriched.filter((row) => {
          const name = row.stationName.toLowerCase();
          const id = row.stationId.toLowerCase();
          return name.includes(normalizedSearch) || id.includes(normalizedSearch);
        })
      : enriched;

    if (activeTab === 'turnover') {
      return filtered.sort((left, right) => right.turnoverScore - left.turnoverScore);
    }

    return filtered.sort((left, right) => right.problemHours - left.problemHours);
  }, [activeTab, rankings, search, stationMap]);

  const visibleRows = showAll ? rows : rows.slice(0, 8);

  const maxTurnover = Math.max(1, ...rows.map((row) => row.turnoverScore));
  const maxProblemRate = Math.max(1, ...rows.map((row) => row.problemRate));
  const itemClass =
    density === 'compact'
      ? 'rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]/90 px-3 py-2'
      : 'rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]/90 px-3 py-2.5';

  return (
    <section className="dashboard-card h-full">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
            Cuellos de botella
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-[var(--muted)]">Estaciones con mayor friccion operativa recurrente.</p>
            <InfoHint
              label="Como se calcula la friccion"
              content="La friccion suma el tiempo en que una estacion estuvo vacia o llena. Cuantas mas horas problema acumula, mas alta aparece en el ranking."
            />
          </div>
        </div>
        <div className="text-right">
          <span className="kpi-chip">{rows.length} resultados</span>
          <div className="mt-1">
            <Link
              href="/dashboard/ayuda#ranking-rotacion-vs-criticidad"
              className="text-xs font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
            >
              Entender ranking
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              activeTab === 'availability'
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]'
            }`}
            onClick={() => {
              updateQuery({ tab: 'availability', showAll: false });
            }}
          >
            Criticas
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              activeTab === 'turnover'
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]'
            }`}
            onClick={() => {
              updateQuery({ tab: 'turnover', showAll: false });
            }}
          >
            Rotacion
          </button>
        </div>

        <input
          className="min-w-[180px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
          placeholder="Buscar estacion"
          value={search}
          onChange={(event) => {
            updateQuery({ search: event.target.value, showAll: false });
          }}
        />
      </div>

      {visibleRows.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Sin datos para este ranking.</p>
      ) : (
        <ul className="space-y-2">
          {visibleRows.map((row) => {
            const barWidth =
              activeTab === 'turnover'
                ? (row.turnoverScore / maxTurnover) * 100
                : (row.problemRate / maxProblemRate) * 100;

            return (
              <li
                key={`${row.id}-${activeTab}`}
                className={itemClass}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{row.stationName}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      {row.stationId}
                    </p>
                  </div>

                  {activeTab === 'turnover' ? (
                    <p className="text-xs font-bold text-[var(--foreground)]">
                      {row.turnoverScore.toFixed(1)}x
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-[var(--foreground)]">
                      {row.problemHours}h · {formatPercent(row.problemRate)}
                    </p>
                  )}
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/25">
                  <div
                    className={`${activeTab === 'turnover' ? 'bg-[var(--accent)]' : 'bg-amber-400'} h-full rounded-full`}
                    style={{ width: `${Math.max(8, Math.min(100, barWidth))}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-[var(--muted)]">
                  {activeTab === 'turnover'
                    ? `Movimiento relativo frente al resto de estaciones. Capacidad ${row.stationCapacity}.`
                    : `Friccion = horas vacia + horas llena sobre ${row.totalHours}h observadas.`}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {rows.length > 8 ? (
        <button
          type="button"
          onClick={() => {
            updateQuery({ showAll: !showAll });
          }}
          className="rounded-lg border border-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
        >
          {showAll ? 'Mostrar menos' : 'Ver mas'}
        </button>
      ) : null}
    </section>
  );
}
