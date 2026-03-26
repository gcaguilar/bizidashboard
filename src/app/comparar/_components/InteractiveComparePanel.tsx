'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  InteractiveComparisonData,
  InteractiveComparisonDimension,
  InteractiveComparisonOption,
} from '@/lib/comparison-hub';
import { appRoutes } from '@/lib/routes';

type InteractiveComparePanelProps = {
  data: InteractiveComparisonData;
  initialQuery?: {
    dimensionId?: string | null;
    leftId?: string | null;
    rightId?: string | null;
  };
};

type SelectionState = Record<
  string,
  {
    leftId: string;
    rightId: string;
  }
>;

function formatSignedNumber(value: number, maximumFractionDigits = 1): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${new Intl.NumberFormat('es-ES', {
    maximumFractionDigits,
  }).format(value)}`;
}

function formatPercentDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`;
}

function resolveOption(
  dimension: InteractiveComparisonDimension,
  requestedId: string | null | undefined,
  fallbackIndex: number
): InteractiveComparisonOption | null {
  if (requestedId) {
    const requested = dimension.options.find((option) => option.id === requestedId);
    if (requested) {
      return requested;
    }
  }

  return dimension.options[fallbackIndex] ?? dimension.options[0] ?? null;
}

function resolveDimension(
  data: InteractiveComparisonData,
  requestedId: string | null | undefined
): InteractiveComparisonDimension | null {
  return (
    data.dimensions.find((dimension) => dimension.id === requestedId) ??
    data.dimensions[0] ??
    null
  );
}

function buildInitialSelectionState(
  data: InteractiveComparisonData,
  initialQuery?: InteractiveComparePanelProps['initialQuery']
): SelectionState {
  const initialState = data.dimensions.reduce<SelectionState>((accumulator, dimension) => {
    accumulator[dimension.id] = {
      leftId: dimension.defaultLeftId ?? dimension.options[0]?.id ?? '',
      rightId:
        dimension.defaultRightId ??
        dimension.options[1]?.id ??
        dimension.options[0]?.id ??
        '',
    };
    return accumulator;
  }, {});

  const requestedDimension = resolveDimension(data, initialQuery?.dimensionId);

  if (!requestedDimension) {
    return initialState;
  }

  const requestedLeftId =
    resolveOption(requestedDimension, initialQuery?.leftId, 0)?.id ??
    initialState[requestedDimension.id]?.leftId ??
    '';
  const requestedRightId =
    resolveOption(requestedDimension, initialQuery?.rightId, 1)?.id ??
    initialState[requestedDimension.id]?.rightId ??
    requestedLeftId;

  return {
    ...initialState,
    [requestedDimension.id]: {
      leftId: requestedLeftId,
      rightId: requestedRightId,
    },
  };
}

export function InteractiveComparePanel({
  data,
  initialQuery,
}: InteractiveComparePanelProps) {
  const router = useRouter();
  const [activeDimensionId, setActiveDimensionId] = useState(() =>
    resolveDimension(data, initialQuery?.dimensionId)?.id ??
    data.defaultDimensionId ??
    data.dimensions[0]?.id ??
    ''
  );
  const [selectionState, setSelectionState] = useState<SelectionState>(() =>
    buildInitialSelectionState(data, initialQuery)
  );
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const lastSyncedHref = useRef<string | null>(null);

  const activeDimension = useMemo(
    () =>
      data.dimensions.find((dimension) => dimension.id === activeDimensionId) ??
      data.dimensions[0] ??
      null,
    [activeDimensionId, data.dimensions]
  );

  const activeSelection = activeDimension
    ? selectionState[activeDimension.id] ?? {
        leftId: activeDimension.defaultLeftId ?? '',
        rightId: activeDimension.defaultRightId ?? '',
      }
    : null;

  const leftOption = activeDimension
    ? resolveOption(activeDimension, activeSelection?.leftId, 0)
    : null;
  const rightOption = activeDimension
    ? resolveOption(activeDimension, activeSelection?.rightId, 1)
    : null;

  const comparisonSummary = useMemo(() => {
    if (!leftOption || !rightOption || !activeDimension) {
      return null;
    }

    const leftValue = leftOption.primaryValue;
    const rightValue = rightOption.primaryValue;

    if (leftValue === null || rightValue === null) {
      return {
        headline: 'La comparativa no tiene una referencia numerica suficiente todavia.',
        detail:
          'Puedes seguir usando los enlaces directos de cada lado mientras se completa el agregado para esta dimension.',
      };
    }

    if (leftValue === rightValue) {
      return {
        headline: `${leftOption.label} y ${rightOption.label} empatan en ${leftOption.primaryLabel.toLowerCase()}.`,
        detail: `Ambos lados muestran ${leftOption.primaryDisplay} en ${activeDimension.label.toLowerCase()}.`,
      };
    }

    const leader = leftValue > rightValue ? leftOption : rightOption;
    const trailer = leader.id === leftOption.id ? rightOption : leftOption;
    const leaderValue = leader.primaryValue ?? 0;
    const trailerValue = trailer.primaryValue ?? 0;
    const absoluteDelta = leaderValue - trailerValue;
    const ratioDelta =
      trailerValue !== 0
        ? absoluteDelta / trailerValue
        : null;

    return {
      headline: `${leader.label} lidera frente a ${trailer.label} en ${leader.primaryLabel.toLowerCase()}.`,
      detail:
        ratioDelta === null
          ? `Ventaja absoluta ${formatSignedNumber(absoluteDelta)}.`
          : `Ventaja absoluta ${formatSignedNumber(absoluteDelta)} y relativa ${formatPercentDelta(ratioDelta)}.`,
    };
  }, [activeDimension, leftOption, rightOption]);

  const shareHref = useMemo(() => {
    if (!activeDimension || !leftOption || !rightOption) {
      return appRoutes.compare();
    }

    return appRoutes.compare({
      dimension: activeDimension.id,
      left: leftOption.id,
      right: rightOption.id,
    });
  }, [activeDimension, leftOption, rightOption]);

  function syncCompareSelection(
    dimension: InteractiveComparisonDimension,
    selection: { leftId: string; rightId: string }
  ) {
    const nextHref = appRoutes.compare({
      dimension: dimension.id,
      left: selection.leftId,
      right: selection.rightId,
    });

    if (lastSyncedHref.current === nextHref) {
      return;
    }

    lastSyncedHref.current = nextHref;
    router.replace(nextHref, { scroll: false });
  }

  useEffect(() => {
    if (copyState === 'idle') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState('idle');
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  if (!activeDimension || !leftOption || !rightOption) {
    return (
      <section className="dashboard-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          Comparador interactivo
        </p>
        <h2 className="mt-2 text-xl font-black text-[var(--foreground)]">
          Elige dos lados y comparalos manualmente
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          El comparador libre ya esta preparado, pero esta instalacion todavia no tiene suficiente
          cobertura para poblar selectores manuales en esta vista.
        </p>
      </section>
    );
  }

  return (
    <section className="dashboard-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Comparador interactivo
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">
            Elige dos lados y comparalos manualmente
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Usa selectores libres para enfrentar estaciones, barrios, meses, anos, horas o
            periodos concretos con el mismo dataset compartido del producto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
          <span className="kpi-chip">{data.dimensions.length} dimensiones comparables</span>
          <span className="kpi-chip">{activeDimension.options.length} opciones en {activeDimension.label.toLowerCase()}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {data.dimensions.map((dimension) => {
          const isActive = dimension.id === activeDimension.id;
          const dimensionSelection = selectionState[dimension.id] ?? {
            leftId: dimension.defaultLeftId ?? dimension.options[0]?.id ?? '',
            rightId:
              dimension.defaultRightId ??
              dimension.options[1]?.id ??
              dimension.options[0]?.id ??
              '',
          };

          return (
            <button
              key={dimension.id}
              type="button"
              onClick={() => {
                setActiveDimensionId(dimension.id);
                syncCompareSelection(dimension, dimensionSelection);
              }}
              aria-pressed={isActive}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]'
              }`}
            >
              {dimension.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {[
          { side: 'left' as const, label: 'Lado A', option: leftOption, fallbackIndex: 0 },
          { side: 'right' as const, label: 'Lado B', option: rightOption, fallbackIndex: 1 },
        ].map((side) => (
          <article
            key={side.side}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
          >
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                {side.label}
              </span>
              <select
                value={side.option.id}
                onChange={(event) => {
                  const nextSelection = {
                    ...(selectionState[activeDimension.id] ?? {
                      leftId: activeDimension.defaultLeftId ?? '',
                      rightId: activeDimension.defaultRightId ?? '',
                    }),
                    [side.side === 'left' ? 'leftId' : 'rightId']: event.target.value,
                  };

                  setSelectionState((current) => ({
                    ...current,
                    [activeDimension.id]: nextSelection,
                  }));
                  syncCompareSelection(activeDimension, nextSelection);
                }}
                className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] outline-none"
              >
                {activeDimension.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 space-y-2 text-sm">
              <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]">
                <span className="font-bold">{side.option.primaryLabel}:</span> {side.option.primaryDisplay}
              </p>
              <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]">
                <span className="font-bold">{side.option.secondaryLabel}:</span> {side.option.secondaryDisplay}
              </p>
              {side.option.tertiaryLabel && side.option.tertiaryDisplay ? (
                <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground)]">
                  <span className="font-bold">{side.option.tertiaryLabel}:</span> {side.option.tertiaryDisplay}
                </p>
              ) : null}
            </div>

            {side.option.note ? (
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{side.option.note}</p>
            ) : null}

            <Link
              href={side.option.href}
              className="mt-4 inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-bold text-[var(--accent)] transition hover:border-[var(--accent)]/40"
            >
              Abrir {side.option.label}
            </Link>
          </article>
        ))}
      </div>

      <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          URL compartible
        </p>
        <p className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--foreground)]">
          {shareHref}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                const absoluteUrl =
                  typeof window === 'undefined'
                    ? shareHref
                    : new URL(shareHref, window.location.origin).toString();
                await navigator.clipboard.writeText(absoluteUrl);
                setCopyState('copied');
              } catch {
                setCopyState('error');
              }
            }}
            className="inline-flex rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Copiar enlace
          </button>
          <Link
            href={shareHref}
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Abrir esta seleccion
          </Link>
        </div>
        {copyState !== 'idle' ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            {copyState === 'copied'
              ? 'Enlace copiado al portapapeles.'
              : 'No se pudo copiar automaticamente el enlace.'}
          </p>
        ) : null}
      </article>

      <article className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/8 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          Lectura comparativa
        </p>
        <h3 className="mt-2 text-lg font-black text-[var(--foreground)]">
          {comparisonSummary?.headline ?? 'Sin comparativa disponible'}
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {comparisonSummary?.detail ?? activeDimension.description}
        </p>
        <p className="mt-3 text-xs text-[var(--muted)]">{activeDimension.description}</p>
      </article>
    </section>
  );
}
