'use client';

import { useState } from 'react';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { StationFavoriteButton } from '@/components/StationFavoriteButton';
import type { StationSnapshot } from '@/lib/api-types';
import { formatInteger, formatPercent } from '@/lib/format';
import {
  buildStationCurrentLabel,
  buildStationIssueLabel,
  type HomeDiagnosisSummary,
} from '@/lib/home-diagnosis';
import { appRoutes } from '@/lib/routes';

export type HomeDiagnosisFilter = 'all' | 'bikes' | 'anchors';
export type HomeDiagnosisTab = 'review' | 'movement';

const MOVEMENT_LABEL = 'Zona de mucho movimiento';
const EMPTY_FILTER_MESSAGE = 'Ninguna estación encaja con este filtro.';
const MOVEMENT_DISCLAIMER =
  'El movimiento estimado ayuda a comparar estaciones; no es el número oficial de viajes.';

const DIAGNOSIS_TABS: { key: HomeDiagnosisTab; label: string }[] = [
  { key: 'review', label: 'Conviene revisar' },
  { key: 'movement', label: 'Más movimiento' },
];

export type HomeDiagnosisProps = {
  problemStations: HomeDiagnosisSummary[];
  mostUsedStations: HomeDiagnosisSummary[];
  filter: HomeDiagnosisFilter;
  className?: string;
};

function stationMatchesFilter(station: StationSnapshot, filter: HomeDiagnosisFilter): boolean {
  if (filter === 'bikes') {
    return station.bikesAvailable > 0;
  }

  if (filter === 'anchors') {
    return station.anchorsFree > 0;
  }

  return true;
}

function DiagnosisStationList({
  stations,
  tab,
  filter,
}: {
  stations: HomeDiagnosisSummary[];
  tab: HomeDiagnosisTab;
  filter: HomeDiagnosisFilter;
}) {
  const visibleStations = stations.filter((summary) =>
    stationMatchesFilter(summary.station, filter),
  );

  if (visibleStations.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--muted)]">{EMPTY_FILTER_MESSAGE}</p>
    );
  }

  return (
    <div className="space-y-2">
      {visibleStations.map((summary, index) => {
        const issueLabel =
          tab === 'review'
            ? buildStationIssueLabel(summary.availability)
            : index === 0
              ? MOVEMENT_LABEL
              : null;

        return (
          <div key={summary.station.id} className="relative">
          <TrackedLink
            href={appRoutes.stationDetail(summary.station.id)}
            entitySelectEvent={{
              source: tab === 'review' ? 'home_problem' : 'home_most_used',
              entityType: 'station',
              module: summary.station.id,
            }}
            className="block rounded-lg border border-[var(--border)] px-3 py-2 pr-14 transition-colors hover:bg-[var(--secondary)]"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {summary.station.name}
              </p>
              {summary.districtName ? (
                <span className="text-xs text-[var(--muted)]">· {summary.districtName}</span>
              ) : null}
            </div>

            {issueLabel ? (
              <span
                className={
                  tab === 'review'
                    ? 'mt-1 inline-block text-xs text-[var(--warning)] border rounded px-1.5'
                    : 'mt-1 inline-block text-xs text-[var(--primary)]'
                }
              >
                {issueLabel}
              </span>
            ) : null}

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
              <span>{buildStationCurrentLabel(summary.station)}</span>
              {tab === 'movement' ? (
                <span>
                  {formatInteger(Number(summary.turnover?.turnoverScore ?? 0))} puntos de
                  movimiento estimado
                </span>
              ) : (
                <span>ocupación {formatPercent(summary.currentOccupancy)}</span>
              )}
            </div>
          </TrackedLink>
          <StationFavoriteButton
            stationId={summary.station.id}
            stationName={summary.station.name}
            variant="icon"
            source={tab === 'review' ? 'home_problem' : 'home_most_used'}
            className="absolute right-3 top-3"
          />
          </div>
        );
      })}
    </div>
  );
}

export function HomeDiagnosis({
  problemStations,
  mostUsedStations,
  filter,
  className,
}: HomeDiagnosisProps) {
  const [activeTab, setActiveTab] = useState<HomeDiagnosisTab>('review');

  const handleTablistKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      setActiveTab((prev) => (prev === 'review' ? 'movement' : 'review'));
    }
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Diagnóstico de estaciones"
        onKeyDown={handleTablistKeyDown}
        className="flex flex-wrap gap-2"
      >
        {DIAGNOSIS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`home-diagnosis-tab-${tab.key}`}
              aria-selected={isActive}
              aria-controls={`home-diagnosis-panel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.key)}
              className={
                isActive
                  ? 'border-b-2 border-[var(--foreground)] px-2 py-1.5 text-xs font-semibold text-[var(--foreground)] transition'
                  : 'border-b-2 border-transparent px-2 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]'
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="home-diagnosis-panel-review"
        aria-labelledby="home-diagnosis-tab-review"
        hidden={activeTab !== 'review'}
        className="pt-3"
      >
        <DiagnosisStationList stations={problemStations} tab="review" filter={filter} />
      </div>

      <div
        role="tabpanel"
        id="home-diagnosis-panel-movement"
        aria-labelledby="home-diagnosis-tab-movement"
        hidden={activeTab !== 'movement'}
        className="pt-3"
      >
        <p className="pb-2 text-xs text-[var(--muted)]">{MOVEMENT_DISCLAIMER}</p>
        <DiagnosisStationList stations={mostUsedStations} tab="movement" filter={filter} />
      </div>
    </div>
  );
}
