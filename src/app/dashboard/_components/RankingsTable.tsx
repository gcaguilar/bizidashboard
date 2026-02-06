'use client';

import { useMemo, useState } from 'react';
import type { RankingsResponse, StationSnapshot } from '@/lib/api';
import { formatPercent } from '@/lib/format';

type RankingsTableProps = {
  rankings: {
    turnover: RankingsResponse;
    availability: RankingsResponse;
  };
  stations: StationSnapshot[];
};

type RankingTab = 'turnover' | 'availability';

type SortKey = 'score' | 'problems';

export function RankingsTable({ rankings, stations }: RankingsTableProps) {
  const [activeTab, setActiveTab] = useState<RankingTab>('turnover');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const stationMap = useMemo(() => {
    return new Map(stations.map((station) => [station.id, station]));
  }, [stations]);

  const rows = useMemo(() => {
    const activeRankings = rankings[activeTab]?.rankings ?? [];
    const normalizedSearch = search.trim().toLowerCase();

    const enriched = activeRankings.map((row) => {
      const station = stationMap.get(row.stationId);
      const problemHours = row.emptyHours + row.fullHours;
      const problemRate =
        row.totalHours > 0 ? (problemHours / row.totalHours) * 100 : 0;

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

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'problems') {
        return a.problemHours - b.problemHours;
      }

      return a.turnoverScore - b.turnoverScore;
    });

    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [activeTab, rankings, search, sortDirection, sortKey, stationMap]);

  const handleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextKey);
    setSortDirection('desc');
  };

  const activeLabel =
    activeTab === 'turnover' ? 'Mas usadas' : 'Mas problematicas';

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Rankings destacados
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Comparativa de uso y disponibilidad reciente.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
                activeTab === 'turnover'
                  ? 'border-transparent bg-[var(--foreground)] text-[var(--surface)]'
                  : 'border-[var(--border)] text-[var(--muted)]'
              }`}
              onClick={() => {
                setActiveTab('turnover');
                setSortKey('score');
                setSortDirection('desc');
              }}
            >
              Mas usadas
            </button>
            <button
              type="button"
              className={`rounded-full border px-4 py-1 text-xs font-semibold transition ${
                activeTab === 'availability'
                  ? 'border-transparent bg-[var(--foreground)] text-[var(--surface)]'
                  : 'border-[var(--border)] text-[var(--muted)]'
              }`}
              onClick={() => {
                setActiveTab('availability');
                setSortKey('problems');
                setSortDirection('desc');
              }}
            >
              Mas problematicas
            </button>
          </div>
          <input
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-xs text-[var(--foreground)] sm:w-64"
            placeholder={`Buscar en ${activeLabel.toLowerCase()}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-[var(--border)] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {activeLabel}
          </p>
          <table className="mt-3 w-full text-xs">
            <thead className="text-[var(--muted)]">
              <tr className="text-left">
                <th className="py-2">Estacion</th>
                <th className="py-2 text-right">Capacidad</th>
                {activeTab === 'turnover' ? (
                  <th className="py-2 text-right">
                    <button
                      type="button"
                      className="font-semibold text-[var(--muted)]"
                      onClick={() => handleSort('score')}
                    >
                      Score
                    </button>
                  </th>
                ) : (
                  <>
                    <th className="py-2 text-right">
                      <button
                        type="button"
                        className="font-semibold text-[var(--muted)]"
                        onClick={() => handleSort('problems')}
                      >
                        Horas problema
                      </button>
                    </th>
                    <th className="py-2 text-right">% problemas</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === 'turnover' ? 3 : 4}
                    className="py-4 text-[var(--muted)]"
                  >
                    Sin datos para este ranking.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="py-2">
                      <div className="font-medium text-[var(--foreground)]">
                        {row.stationName}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                        {row.stationId}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      {row.stationCapacity}
                    </td>
                    {activeTab === 'turnover' ? (
                      <td className="py-2 text-right">
                        {row.turnoverScore.toFixed(1)}
                      </td>
                    ) : (
                      <>
                        <td className="py-2 text-right">{row.problemHours}</td>
                        <td className="py-2 text-right">
                          {formatPercent(row.problemRate)}
                        </td>
                      </>
                    )}
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
