'use client';

import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFavorites } from '@/app/_components/HomeFavoritesClient';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { CompareEntitySelect } from '@/app/comparar/_components/CompareEntitySelect';
import { CompareMetricColumns } from '@/app/comparar/_components/CompareMetricColumns';
import { ComparePresets } from '@/app/comparar/_components/ComparePresets';
import { CompareTideBands } from '@/app/comparar/_components/CompareTideBands';
import { CompareVerdictHero } from '@/app/comparar/_components/CompareVerdictHero';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DISTRICT_POPULAR_HINTS, STATION_POPULAR_HINTS } from '@/lib/compare-search';
import type {
  ComparisonPreset,
  InteractiveComparisonData,
  InteractiveComparisonDimension,
  InteractiveComparisonOption,
} from '@/lib/comparison-hub';
import { buildComparisonVerdict } from '@/lib/comparison-verdict';
import { appRoutes } from '@/lib/routes';
import { useSavedComparisons, type SavedComparison } from '@/lib/use-saved-comparisons';

type InteractiveComparePanelProps = {
  data: InteractiveComparisonData;
  initialQuery?: {
    dimensionId?: string | null;
    leftId?: string | null;
    rightId?: string | null;
    scopeId?: string | null;
  };
};

type SelectionState = Record<
  string,
  {
    leftId: string;
    rightId: string;
  }
>;

function resolveOption(
  options: InteractiveComparisonOption[],
  requestedId: string | null | undefined,
  fallbackIndex: number
): InteractiveComparisonOption | null {
  if (requestedId) {
    const requested = options.find((option) => option.id === requestedId);
    if (requested) {
      return requested;
    }
  }

  return options[fallbackIndex] ?? options[0] ?? null;
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

  const optionPool = requestedDimension.options;
  const requestedLeftId =
    resolveOption(optionPool, initialQuery?.leftId, 0)?.id ??
    initialState[requestedDimension.id]?.leftId ??
    '';
  const requestedRightId =
    resolveOption(optionPool, initialQuery?.rightId, 1)?.id ??
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

function haversineMeters(
  left: { lat: number; lon: number },
  right: { lat: number; lon: number }
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = toRadians(right.lat - left.lat);
  const dLon = toRadians(right.lon - left.lon);
  const lat1 = toRadians(left.lat);
  const lat2 = toRadians(right.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(a)));
}

function findNearestOption(
  options: InteractiveComparisonOption[],
  target: { lat: number; lon: number },
  excludeId?: string
): InteractiveComparisonOption | null {
  let nearest: InteractiveComparisonOption | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const option of options) {
    if (option.lat === undefined || option.lon === undefined) {
      continue;
    }
    if (excludeId && option.id === excludeId) {
      continue;
    }
    const distance = haversineMeters(target, { lat: option.lat, lon: option.lon });
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = option;
    }
  }

  return nearest;
}

export function InteractiveComparePanel({
  data,
  initialQuery,
}: InteractiveComparePanelProps) {
  const navigate = useNavigate();
  const [activeDimensionId, setActiveDimensionId] = useState(() =>
    resolveDimension(data, initialQuery?.dimensionId)?.id ??
    data.defaultDimensionId ??
    data.dimensions[0]?.id ??
    ''
  );
  const [selectionState, setSelectionState] = useState<SelectionState>(() =>
    buildInitialSelectionState(data, initialQuery)
  );
  const [scopeId, setScopeId] = useState<string | null>(() => {
    const scopes = resolveDimension(data, initialQuery?.dimensionId)?.scopes;
    if (!scopes || scopes.length === 0) {
      return null;
    }
    const requested = initialQuery?.scopeId;
    return scopes.some((scope) => scope.id === requested)
      ? (requested ?? null)
      : (scopes[0]?.id ?? null);
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [geoState, setGeoState] = useState<'idle' | 'locating' | 'denied' | 'unsupported'>('idle');
  const [presetNote, setPresetNote] = useState<string | null>(null);
  const lastSyncedHref = useRef<string | null>(null);

  const { favoriteIds, toggleFavorite } = useFavorites();
  const { savedComparisons, saveComparison, removeComparison } = useSavedComparisons();
  const presets = data.presets ?? [];

  const activeDimension = useMemo(
    () =>
      data.dimensions.find((dimension) => dimension.id === activeDimensionId) ??
      data.dimensions[0] ??
      null,
    [activeDimensionId, data.dimensions]
  );

  const activeScope = useMemo(() => {
    const scopes = activeDimension?.scopes;
    if (!scopes || scopes.length === 0) {
      return null;
    }
    return scopes.find((scope) => scope.id === scopeId) ?? scopes[0] ?? null;
  }, [activeDimension, scopeId]);

  const optionPool = activeScope?.options ?? activeDimension?.options ?? [];

  const activeSelection = activeDimension
    ? selectionState[activeDimension.id] ?? {
        leftId: activeDimension.defaultLeftId ?? '',
        rightId: activeDimension.defaultRightId ?? '',
      }
    : null;

  const leftOption = resolveOption(optionPool, activeSelection?.leftId, 0);
  const rightOption = resolveOption(optionPool, activeSelection?.rightId, 1);

  const verdict = useMemo(() => {
    if (!activeDimension || !leftOption || !rightOption) {
      return null;
    }
    return buildComparisonVerdict({
      dimensionId: activeDimension.id,
      left: leftOption,
      right: rightOption,
    });
  }, [activeDimension, leftOption, rightOption]);

  const shareHref = useMemo(() => {
    if (!activeDimension || !leftOption || !rightOption) {
      return appRoutes.compare();
    }

    return appRoutes.compare({
      dimension: activeDimension.id,
      left: leftOption.id,
      right: rightOption.id,
      scope: activeScope?.id ?? null,
    });
  }, [activeDimension, leftOption, rightOption, activeScope]);

  const labelLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const dimension of data.dimensions) {
      for (const option of dimension.options) {
        map.set(`${dimension.id}:${option.id}`, option.label);
      }
      for (const scope of dimension.scopes ?? []) {
        for (const option of scope.options) {
          map.set(`${dimension.id}:${option.id}`, option.label);
        }
      }
    }
    return map;
  }, [data.dimensions]);

  const dimensionLabelById = useMemo(
    () => new Map<string, string>(data.dimensions.map((dimension) => [dimension.id, dimension.label])),
    [data.dimensions]
  );

  const syncCompareSelection = useCallback(
    (
      dimension: InteractiveComparisonDimension,
      selection: { leftId: string; rightId: string },
      scope: string | null
    ) => {
      const nextHref = appRoutes.compare({
        dimension: dimension.id,
        left: selection.leftId,
        right: selection.rightId,
        scope,
      });

      if (lastSyncedHref.current === nextHref) {
        return;
      }

      lastSyncedHref.current = nextHref;
      void navigate({
        to: appRoutes.compare(),
        search: {
          dimension: dimension.id,
          left: selection.leftId,
          right: selection.rightId,
          scope: scope ?? undefined,
        },
        replace: true,
        // Misma ruta, solo cambian parametros de busqueda: no debe saltar el scroll arriba.
        resetScroll: false,
      });
    },
    [navigate]
  );

  const locateUser = useCallback((): Promise<{ lat: number; lon: number } | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setGeoState('unsupported');
        resolve(null);
        return;
      }

      setGeoState('locating');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoState('idle');
          resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
        },
        () => {
          setGeoState('denied');
          resolve(null);
        },
        { timeout: 8000, maximumAge: 60_000 }
      );
    });
  }, []);

  const handlePreset = useCallback(
    async (preset: ComparisonPreset) => {
      const dimension = data.dimensions.find((candidate) => candidate.id === preset.dimensionId);
      if (!dimension) {
        return;
      }

      const options = dimension.scopes?.[0]?.options ?? dimension.options;
      let leftId = preset.leftId ?? dimension.defaultLeftId ?? options[0]?.id ?? '';
      let rightId = preset.rightId ?? dimension.defaultRightId ?? options[1]?.id ?? leftId;
      let note: string | null = null;

      if (preset.id === 'saved-stations') {
        const favorites = favoriteIds.filter((id) => options.some((option) => option.id === id));
        if (favorites.length >= 2) {
          leftId = favorites[0] ?? leftId;
          rightId = favorites[1] ?? rightId;
        } else if (favorites.length === 1) {
          leftId = favorites[0] ?? leftId;
          const base = options.find((option) => option.id === leftId);
          const nearest =
            base && base.lat !== undefined && base.lon !== undefined
              ? findNearestOption(options, { lat: base.lat, lon: base.lon }, base.id)
              : null;
          if (nearest) {
            rightId = nearest.id;
          }
          note = 'Solo hay una estación guardada: la comparamos con la más cercana.';
        } else {
          note = 'Guarda al menos dos estaciones con la estrella para usar este acceso.';
        }
      }

      if (preset.id === 'nearest-alternative') {
        const located = await locateUser();
        const base = options.find((option) => option.id === leftId);
        const target =
          located ??
          (base && base.lat !== undefined && base.lon !== undefined
            ? { lat: base.lat, lon: base.lon }
            : null);
        if (target) {
          const nearest = findNearestOption(options, target);
          if (nearest) {
            leftId = nearest.id;
            const alternative =
              nearest.lat !== undefined && nearest.lon !== undefined
                ? findNearestOption(options, { lat: nearest.lat, lon: nearest.lon }, nearest.id)
                : null;
            if (alternative) {
              rightId = alternative.id;
            }

            const anchor = alternative ?? nearest;
            if (
              alternative &&
              nearest.lat !== undefined &&
              nearest.lon !== undefined &&
              alternative.lat !== undefined &&
              alternative.lon !== undefined
            ) {
              const meters = haversineMeters(
                { lat: nearest.lat, lon: nearest.lon },
                { lat: alternative.lat, lon: alternative.lon }
              );
              const minutes = Math.max(1, Math.round(meters / 80));
              note = `${anchor.label} está a ~${minutes} min a pie de ${nearest.label}${
                minutes > 5 ? ' (algo más de 5 min)' : ''
              }.`;
            } else if (anchor) {
              note = `Alternativa a ${nearest.label}: ${anchor.label}.`;
            }
          }
        }
      }

      if (preset.id === 'today-vs-last-week' && dimension.scopes && dimension.scopes.length > 0) {
        const scope = dimension.scopes[0];
        if (scope) {
          setScopeId(scope.id);
          leftId = scope.defaultLeftId ?? leftId;
          rightId = scope.defaultRightId ?? rightId;
        }
      }

      const nextSelection = { leftId, rightId };
      setPresetNote(note);
      setActivePresetId(preset.id);
      setActiveDimensionId(dimension.id);
      setSelectionState((current) => ({ ...current, [dimension.id]: nextSelection }));
      syncCompareSelection(dimension, nextSelection, dimension.scopes?.[0]?.id ?? null);
    },
    [data.dimensions, favoriteIds, locateUser, syncCompareSelection]
  );

  function selectDimension(dimension: InteractiveComparisonDimension) {
    setActivePresetId(null);
    setPresetNote(null);
    setActiveDimensionId(dimension.id);
    const selection = selectionState[dimension.id] ?? {
      leftId: dimension.defaultLeftId ?? dimension.options[0]?.id ?? '',
      rightId:
        dimension.defaultRightId ??
        dimension.options[1]?.id ??
        dimension.options[0]?.id ??
        '',
    };
    const nextScope = dimension.scopes?.[0]?.id ?? null;
    if (nextScope) {
      setScopeId(nextScope);
    }
    syncCompareSelection(dimension, selection, nextScope);
  }

  function changeSideOption(side: 'left' | 'right', value: string | null) {
    if (!value || !activeDimension) {
      return;
    }
    const current = selectionState[activeDimension.id] ?? {
      leftId: activeDimension.defaultLeftId ?? '',
      rightId: activeDimension.defaultRightId ?? '',
    };
    const nextSelection = {
      ...current,
      [side === 'left' ? 'leftId' : 'rightId']: value,
    };
    setActivePresetId(null);
    setPresetNote(null);
    setSelectionState((state) => ({ ...state, [activeDimension.id]: nextSelection }));
    syncCompareSelection(activeDimension, nextSelection, activeScope?.id ?? null);
  }

  function applySavedComparison(entry: SavedComparison) {
    const dimension = data.dimensions.find((candidate) => candidate.id === entry.dimension);
    if (!dimension) {
      return;
    }
    const nextScope =
      entry.scope && dimension.scopes?.some((scope) => scope.id === entry.scope)
        ? entry.scope
        : dimension.scopes?.[0]?.id ?? null;
    if (nextScope) {
      setScopeId(nextScope);
    }
    const nextSelection = { leftId: entry.left, rightId: entry.right };
    setActivePresetId(null);
    setPresetNote(null);
    setActiveDimensionId(dimension.id);
    setSelectionState((state) => ({ ...state, [dimension.id]: nextSelection }));
    syncCompareSelection(dimension, nextSelection, nextScope);
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

  if (data.dimensions.length === 0) {
    return (
      <section className="ui-section-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          Comparador interactivo
        </p>
        <h2 className="mt-2 text-xl font-black text-[var(--foreground)]">
          Elige dos lados y compáralos manualmente
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          El comparador libre ya está preparado, pero esta instalación todavía no tiene suficiente
          cobertura para poblar selectores manuales en esta vista.
        </p>
      </section>
    );
  }

  if (!activeDimension || !leftOption || !rightOption) {
    return (
      <section className="ui-section-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          Comparador interactivo
        </p>
        <h2 className="mt-2 text-xl font-black text-[var(--foreground)]">
          Elige dos lados y compáralos manualmente
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          No hay suficientes datos agregados para completar esta comparación todavía.
        </p>
      </section>
    );
  }

  const primaryDimensions = data.dimensions.filter((dimension) => dimension.primary);
  const secondaryDimensions = data.dimensions.filter((dimension) => !dimension.primary);
  const showTabs = primaryDimensions.length > 0;
  const tabDimensions = showTabs ? primaryDimensions : data.dimensions;
  const stationDimensionActive = activeDimension.id === 'stations';
  const searchableDimension =
    activeDimension.id === 'stations' || activeDimension.id === 'districts';

  const currentComparison: SavedComparison = {
    dimension: activeDimension.id,
    left: leftOption.id,
    right: rightOption.id,
    scope: activeScope?.id ?? null,
  };
  const isCurrentSaved = savedComparisons.some(
    (entry) =>
      entry.dimension === currentComparison.dimension &&
      entry.left === currentComparison.left &&
      entry.right === currentComparison.right &&
      (entry.scope ?? null) === currentComparison.scope
  );

  return (
    <section className="ui-section-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Comparador interactivo
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">
            Elige dos lados y compáralos
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Sin registro: compara estaciones, barrios o periodos y lee la conclusión en lenguaje
            claro. Tus estaciones guardadas se quedan en este dispositivo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
          <span className="ui-chip">{data.dimensions.length} dimensiones comparables</span>
          <span className="ui-chip">
            {optionPool.length} opciones en {activeDimension.label.toLowerCase()}
          </span>
        </div>
      </div>

      <ComparePresets
        presets={presets}
        activePresetId={activePresetId}
        onSelect={handlePreset}
        getDisabledReason={(preset) => {
          if (!preset.requiresFavorites) {
            return null;
          }
          if (favoriteIds.length < 2) {
            return 'Guarda al menos dos estaciones con la estrella para compararlas aquí.';
          }
          return null;
        }}
      />

      {presetNote ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-xs leading-relaxed text-[var(--foreground)]">
          {presetNote}
        </p>
      ) : null}

      {geoState === 'locating' ? (
        <p className="text-xs text-[var(--muted)]">Buscando tu ubicación para la estación más cercana…</p>
      ) : null}
      {geoState === 'denied' || geoState === 'unsupported' ? (
        <p className="text-xs text-[var(--muted)]">
          Sin acceso a tu ubicación: usamos la estación principal como referencia.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabDimensions.map((dimension) => {
          const isActive = dimension.id === activeDimension.id;
          return (
            <button
              key={dimension.id}
              type="button"
              className="compare-tab"
              aria-pressed={isActive}
              onClick={() => selectDimension(dimension)}
            >
              {dimension.id === 'stations'
                ? '2 Estaciones'
                : dimension.id === 'districts'
                  ? '2 Barrios'
                  : dimension.id === 'periods'
                    ? '2 Periodos'
                    : dimension.label}
            </button>
          );
        })}
      </div>

      {secondaryDimensions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Más comparativas
          </span>
          {secondaryDimensions.map((dimension) => (
            <Button
              key={dimension.id}
              variant="chip"
              size="sm"
              aria-pressed={dimension.id === activeDimension.id}
              onClick={() => selectDimension(dimension)}
              className={
                dimension.id === activeDimension.id
                  ? 'rounded-full border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'rounded-full'
              }
            >
              {dimension.label}
            </Button>
          ))}
        </div>
      ) : null}

      {activeDimension.scopes && activeDimension.scopes.length > 0 ? (
        <div className="max-w-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Ámbito
          </p>
          <Select
            value={activeScope?.id ?? activeDimension.scopes[0]?.id ?? ''}
            onValueChange={(value) => {
              if (!value) {
                return;
              }
              setScopeId(value);
              const selection = selectionState[activeDimension.id] ?? {
                leftId: activeDimension.defaultLeftId ?? '',
                rightId: activeDimension.defaultRightId ?? '',
              };
              syncCompareSelection(activeDimension, selection, value);
            }}
          >
            <SelectTrigger className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]">
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              {activeDimension.scopes.map((scope) => (
                <SelectItem key={scope.id} value={scope.id}>
                  {scope.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {[
          { side: 'left' as const, label: 'Lado A', option: leftOption },
          { side: 'right' as const, label: 'Lado B', option: rightOption },
        ].map((side) => {
          const isFavorite = favoriteIds.includes(side.option.id);
          return (
            <article
              key={side.side}
              className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {side.label}
                  </p>
                  {searchableDimension ? (
                    <CompareEntitySelect
                      id={`compare-${side.side}`}
                      ariaLabel={`${side.label}: seleccionar entidad`}
                      options={optionPool}
                      value={side.option.id}
                      onValueChange={(value) => changeSideOption(side.side, value)}
                      popularHints={
                        activeDimension.id === 'stations'
                          ? STATION_POPULAR_HINTS
                          : DISTRICT_POPULAR_HINTS
                      }
                      favoriteIds={activeDimension.id === 'stations' ? favoriteIds : undefined}
                      searchPlaceholder={
                        activeDimension.id === 'stations'
                          ? 'Buscar estación por nombre o ID'
                          : 'Buscar barrio'
                      }
                    />
                  ) : (
                    <Select
                      value={side.option.id}
                      onValueChange={(value) => changeSideOption(side.side, value)}
                    >
                      <SelectTrigger className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]">
                        <SelectValue />
                        <SelectIcon />
                      </SelectTrigger>
                      <SelectContent>
                        {optionPool.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {stationDimensionActive && side.option.kind !== 'city-average' ? (
                  <button
                    type="button"
                    className="ui-icon-button mt-5 shrink-0"
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? 'Quitar de guardadas' : 'Guardar estación'}
                    title={isFavorite ? 'Quitar de guardadas' : 'Guardar en este dispositivo'}
                    onClick={() => toggleFavorite(side.option.id)}
                  >
                    <span aria-hidden>{isFavorite ? '★' : '☆'}</span>
                  </button>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]">
                  <span className="font-bold">{side.option.primaryLabel}:</span>{' '}
                  {side.option.primaryDisplay}
                </p>
                <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]">
                  <span className="font-bold">{side.option.secondaryLabel}:</span>{' '}
                  {side.option.secondaryDisplay}
                </p>
                {side.option.tertiaryLabel && side.option.tertiaryDisplay ? (
                  <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)]">
                    <span className="font-bold">{side.option.tertiaryLabel}:</span>{' '}
                    {side.option.tertiaryDisplay}
                  </p>
                ) : null}
              </div>

              {side.option.note ? (
                <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{side.option.note}</p>
              ) : null}

              <TrackedLink href={side.option.href} className="ui-inline-action mt-4">
                Abrir {side.option.label}
              </TrackedLink>
            </article>
          );
        })}
      </div>

      <CompareVerdictHero verdict={verdict} />

      <CompareMetricColumns left={leftOption} right={rightOption} />

      <CompareTideBands left={leftOption} right={rightOption} />

      <article className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          URL compartible
        </p>
        <p className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs text-[var(--foreground)]">
          {shareHref}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
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
            variant="default"
            size="sm"
          >
            Copiar enlace
          </Button>
          <TrackedLink href={shareHref} className="ui-inline-action">
            Abrir esta selección
          </TrackedLink>
        </div>
        {copyState !== 'idle' ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            {copyState === 'copied'
              ? 'Enlace copiado al portapapeles.'
              : 'No se pudo copiar automáticamente. Selecciona y copia la URL compartible de arriba.'}
          </p>
        ) : null}
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Comparaciones guardadas
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Se guardan en este dispositivo, sin cuenta ni registro.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            aria-pressed={isCurrentSaved}
            onClick={() =>
              isCurrentSaved
                ? removeComparison(currentComparison)
                : saveComparison(currentComparison)
            }
          >
            {isCurrentSaved ? '★ Quitar de guardadas' : '☆ Guardar esta comparación'}
          </Button>
        </div>

        {savedComparisons.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {savedComparisons.map((entry) => {
              const leftLabel = labelLookup.get(`${entry.dimension}:${entry.left}`) ?? entry.left;
              const rightLabel =
                labelLookup.get(`${entry.dimension}:${entry.right}`) ?? entry.right;
              const dimensionLabel =
                dimensionLabelById.get(entry.dimension) ?? entry.dimension;
              const key = `${entry.dimension}:${entry.left}:${entry.right}:${entry.scope ?? ''}`;

              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] py-1 pl-3 pr-1 text-xs"
                >
                  <button
                    type="button"
                    className="max-w-[20rem] truncate text-left font-semibold text-[var(--foreground)]"
                    title={`${dimensionLabel}: ${leftLabel} vs ${rightLabel}`}
                    onClick={() => applySavedComparison(entry)}
                  >
                    {leftLabel} vs {rightLabel}
                  </button>
                  <button
                    type="button"
                    className="ui-icon-button min-h-6 min-w-6 px-2 text-xs"
                    aria-label={`Quitar ${leftLabel} vs ${rightLabel}`}
                    onClick={() => removeComparison(entry)}
                  >
                    <span aria-hidden>×</span>
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-xs text-[var(--muted)]">
            Aún no has guardado ninguna comparación. Guarda las que uses a menudo para volver a
            ellas con un clic.
          </p>
        )}
      </article>
    </section>
  );
}
