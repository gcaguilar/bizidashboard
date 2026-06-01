'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeaderCard } from '@/components/layout/page-header-card';

type QuickHeaderProps = {
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  filteredStationsCount: number;
  totalStationsCount: number;
  activeAlertsCount: number;
  updatedText: string;
  onSwitchToFull: () => void;
};

export function QuickHeader({
  searchQuery,
  onChangeSearch,
  filteredStationsCount,
  totalStationsCount,
  activeAlertsCount,
  updatedText,
  onSwitchToFull,
}: QuickHeaderProps) {
  return (
    <PageHeaderCard>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 min-w-0">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Vista rapida</p>
            <h1 className="truncate text-xl font-bold tracking-tight text-[var(--foreground)]">
              Resumen operativo
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1 font-semibold text-[var(--foreground)]">
              Estaciones {filteredStationsCount}/{totalStationsCount}
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1 font-semibold text-[var(--foreground)]">
              Alertas activas {activeAlertsCount}
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1">
              Actualizado {updatedText}
            </span>
          </div>
        </div>

        <Button
          type="button"
          onClick={onSwitchToFull}
          variant="outline"
          size="sm"
          aria-pressed={false}
        >
          Modo completo
        </Button>
      </div>

      <div className="mt-3 border-t border-[var(--border)]/70 pt-3">
        <label htmlFor="dashboard-quick-search" className="sr-only">
          Buscar estacion, identificador o barrio
        </label>
        <Input
          id="dashboard-quick-search"
          type="text"
          className="min-h-11 border-[var(--border)] bg-[var(--secondary)] py-2"
          placeholder="Buscar estacion, ID o barrio..."
          value={searchQuery}
          onChange={(event) => onChangeSearch(event.target.value)}
        />
      </div>
    </PageHeaderCard>
  );
}
