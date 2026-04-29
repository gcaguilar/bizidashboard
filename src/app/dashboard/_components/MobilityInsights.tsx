'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartWrapper } from './ChartWrapper';
import type { StationSnapshot } from '@/lib/api';
import {
  resolveMobilityDataState,
  shouldShowDataStateNotice,
} from '@/lib/data-state';
import {
  fetchDistrictCollection,
  type DistrictCollection,
  isDistrictCollection,
} from '@/lib/districts';
import { formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import {
  buildChordLinks,
  buildChordNodes,
  buildDailyCurveData,
  buildPeriodInsights,
  buildStationDistrictLookup,
  buildTopEmitterTowardReference,
  buildTopReceiverFromReference,
  buildTopRoutes,
  getMatrixCellColor,
  isMobilityResponse,
  PERIODS,
  resolvePeriod,
  resolveSelectedDistrictName,
  type MobilityResponse,
  type PeriodInsights,
} from './mobility-insights-model';
import { MeasuredResponsiveContainer } from './MeasuredResponsiveContainer';

type MobilityInsightsProps = {
  stations: StationSnapshot[];
  selectedStationId?: string;
  mobilityDays?: number;
  demandDays?: number;
};

function MobilityInsightsContent({
  stations,
  selectedStationId,
  mobilityDays = 14,
  demandDays = 30,
}: MobilityInsightsProps) {
  const searchParams = useSearchParams();

  const [mobilityData, setMobilityData] = useState<MobilityResponse | null>(null);
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');
  const selectedMonth = searchParams.get('month');
  const activePeriod = resolvePeriod(searchParams.get('period'));

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const searchParams = new URLSearchParams({
          mobilityDays: String(mobilityDays),
          demandDays: String(demandDays),
        });

        if (selectedMonth) {
          searchParams.set('month', selectedMonth);
        }

        const [mobilityResponse, districtsPayload] = await Promise.all([
          fetch(`${appRoutes.api.mobility()}?${searchParams.toString()}`, {
            signal: controller.signal,
          }),
          fetchDistrictCollection(controller.signal),
        ]);

        if (!mobilityResponse.ok || !districtsPayload) {
          throw new Error('No se pudieron cargar los datos de movilidad.');
        }

        const mobilityPayload = (await mobilityResponse.json()) as unknown;

        if (!isActive) {
          return;
        }

        if (!isMobilityResponse(mobilityPayload)) {
          throw new Error('Respuesta de movilidad invalida.');
        }

        if (!isDistrictCollection(districtsPayload)) {
          throw new Error('GeoJSON de distritos invalido.');
        }

        setMobilityData(mobilityPayload);
        setDistricts(districtsPayload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        captureExceptionWithContext(error, {
          area: 'dashboard.mobility-insights',
          operation: 'loadData',
          extra: {
            mobilityDays,
            demandDays,
            selectedMonth,
          },
        });
        console.error('[Dashboard] Error cargando movilidad', error);
        if (isActive) {
          setErrorMessage('No se pudieron cargar los insights de movilidad.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [demandDays, mobilityDays, selectedMonth]);

  const stationDistrictMap = useMemo(() => {
    return buildStationDistrictLookup(stations, districts);
  }, [districts, stations]);

  const periodInsights = useMemo<PeriodInsights[]>(() => {
    return buildPeriodInsights(mobilityData, stationDistrictMap);
  }, [mobilityData, stationDistrictMap]);

  const activeInsights =
    periodInsights.find((insights) => insights.key === activePeriod) ?? periodInsights[0];

  const topRoutes = useMemo(() => buildTopRoutes(activeInsights), [activeInsights]);

  const selectedDistrict = selectedStationId
    ? stationDistrictMap.get(selectedStationId) ?? null
    : null;

  useEffect(() => {
    setSelectedDistrictName((current) => {
      return resolveSelectedDistrictName(activeInsights, selectedDistrict, current);
    });
  }, [activeInsights, selectedDistrict]);

  const selectedDistrictFlow = activeInsights?.districts.find(
    (district) => district.district === selectedDistrictName
  );

  /** Barrio distinto del de referencia con mayor flujo estimado matrix[i][ref] (aportes hacia el referencia). */
  const topEmitterTowardRef = useMemo(
    () => buildTopEmitterTowardReference(activeInsights, selectedDistrictName),
    [activeInsights, selectedDistrictName]
  );

  /** Barrio distinto con mayor flujo estimado matrix[ref][j] (recibe salidas del referencia). */
  const topReceiverFromRef = useMemo(
    () => buildTopReceiverFromReference(activeInsights, selectedDistrictName),
    [activeInsights, selectedDistrictName]
  );

  const dailyCurveData = useMemo(() => buildDailyCurveData(mobilityData), [mobilityData]);

  const chordNodes = useMemo(() => buildChordNodes(activeInsights), [activeInsights]);

  const chordLinks = useMemo(
    () => buildChordLinks(chordNodes, topRoutes),
    [chordNodes, topRoutes]
  );
  const mobilityDataState = resolveMobilityDataState({
    dailyDemandCount: mobilityData?.dailyDemand.length ?? 0,
    hourlySignalCount: mobilityData?.hourlySignals.length ?? 0,
    requestedDemandDays: demandDays,
  });
  const resolvedMobilityState = isLoading
    ? 'loading'
    : errorMessage
      ? 'error'
      : mobilityData?.dataState ?? mobilityDataState;
  const canRenderInsights =
    resolvedMobilityState === 'ok' ||
    resolvedMobilityState === 'partial' ||
    resolvedMobilityState === 'stale';

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black leading-tight tracking-tight text-[var(--foreground)]">
            Analisis de flujo por barrios
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Distribucion interdistrital de trayectos y metricas de balance neto.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)]/80 p-1">
          {PERIODS.map((period) => (
            <Link
              key={period.key}
              href={appRoutes.dashboardFlow({
                month: selectedMonth,
                period: period.key === 'all' ? null : period.key,
              })}
              aria-current={activePeriod === period.key ? 'page' : undefined}
              className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${
                activePeriod === period.key
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {period.label}
            </Link>
          ))}
        </div>
      </header>

      {shouldShowDataStateNotice(resolvedMobilityState) ? (
        <DataStateNotice
          state={resolvedMobilityState}
          subject="los insights de movilidad"
          description={
            errorMessage ??
            (isLoading
              ? 'Estamos calculando flujo, rutas y demanda agregada.'
              : resolvedMobilityState === 'partial'
                ? 'Hay datos suficientes para analizar movilidad, pero la ventana disponible es parcial.'
                : resolvedMobilityState === 'stale'
                  ? 'Las curvas estan disponibles, pero el dataset actual no esta fresco.'
                  : 'No hay datos de movilidad suficientes para esta ventana.')
          }
          href={appRoutes.status()}
          actionLabel="Ver estado"
        />
      ) : null}

      {canRenderInsights && mobilityData && activeInsights ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <Card className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Diagrama chord interdistrital</h3>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--muted)]">
                  Resume de un vistazo que barrios parecen enviar o recibir mas flujo en el periodo activo. Cada nodo es un barrio y cada curva representa un corredor estimado: cuanto mas marcada, mas volumen relativo.
                </p>
              </div>
              <div className="text-right text-xs text-[var(--muted)]">
                <span>Barrios representados: {chordNodes.length}</span>
                <div>
                  <Link
                    href={appRoutes.dashboardHelp('diagrama-chord')}
                    className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    Como interpretarlo
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center rounded-full border border-dashed border-[var(--border)] bg-[var(--secondary)] py-4">
              <svg viewBox="0 0 280 280" className="h-[260px] w-[260px]">
                <circle cx="140" cy="140" r="116" fill="none" stroke="rgba(234,6,21,0.22)" />
                {chordLinks.map((link, index) => {
                  const from = chordNodes.find((node) => node.district === link.origin);
                  const to = chordNodes.find((node) => node.district === link.destination);

                  if (!from || !to) {
                    return null;
                  }

                  const controlX = 140;
                  const controlY = 140;
                  const opacity = 0.25 + Math.min(0.65, link.flow / (activeInsights.maxFlow || 1));

                  return (
                    <path
                      key={`${link.origin}-${link.destination}-${index}`}
                      d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
                      fill="none"
                      stroke={`rgba(234, 6, 21, ${opacity})`}
                      strokeWidth={1.2 + (link.flow / (activeInsights.maxFlow || 1)) * 3}
                    />
                  );
                })}
                {chordNodes.map((node) => (
                  <g key={node.district}>
                    <circle cx={node.x} cy={node.y} r="5" fill="#ea0615" />
                    <text
                      x={node.x}
                      y={node.y - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--foreground)"
                    >
                      {node.district.slice(0, 10)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
              <span className="ui-legend-item">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" /> Mayor flujo estimado
              </span>
            </div>
          </Card>

          <div className="space-y-6 xl:col-span-4">
            <Card className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-base font-bold text-[var(--foreground)]">Rutas de mayor flujo</h3>
              <div className="mt-4 space-y-4">
                {topRoutes.slice(0, 4).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Sin rutas destacadas para este periodo.</p>
                ) : (
                  topRoutes.slice(0, 4).map((route) => {
                    const width = Math.max(
                      12,
                      Math.round((route.flow / (activeInsights.maxFlow || 1)) * 100)
                    );

                    return (
                      <div key={`${route.origin}-${route.destination}`} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-semibold text-[var(--foreground)]">
                            {route.origin} → {route.destination}
                          </span>
                          <span className="font-bold text-[var(--muted)]">{route.flow.toFixed(0)}</span>
                        </div>
                        <Progress className="bg-black/20" value={width} indicatorClassName="bg-[var(--primary)]" />
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-base font-bold text-[var(--foreground)]">Resumen de balance neto</h3>
              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3">
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Barrio de referencia
                </label>
                <Select
                  value={selectedDistrictName}
                  onValueChange={(value) => setSelectedDistrictName(value ?? '')}
                >
                  <SelectTrigger
                    aria-label="Seleccionar barrio de referencia"
                    className="mt-2 w-full bg-[var(--card)]"
                  >
                    <SelectValue placeholder="Selecciona un barrio" />
                    <SelectIcon />
                  </SelectTrigger>
                  <SelectContent>
                    {activeInsights.districts.map((district) => (
                      <SelectItem key={district.district} value={district.district}>
                        {district.district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Cambia el barrio para revisar su saldo neto y los barrios con mas flujo estimado hacia el y desde el.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-rose-500">
                    Mayor aporte hacia referencia
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-rose-500/80">
                    Emisor hacia {selectedDistrictName || '…'}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
                    {topEmitterTowardRef?.district ?? 'N/D'}
                  </p>
                  <p className="text-xl font-black text-rose-500">
                    {topEmitterTowardRef ? topEmitterTowardRef.flow.toFixed(0) : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-500">
                    Mayor destino desde referencia
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-500/80">
                    Receptor desde {selectedDistrictName || '…'}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
                    {topReceiverFromRef?.district ?? 'N/D'}
                  </p>
                  <p className="text-xl font-black text-emerald-500">
                    {topReceiverFromRef ? topReceiverFromRef.flow.toFixed(0) : '—'}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-xs text-[var(--muted)]">
                {selectedDistrictFlow ? (
                  <>
                    <span className="font-semibold text-[var(--foreground)]">{selectedDistrictName}</span>
                    {`: ${selectedDistrictFlow.net >= 0 ? '+' : ''}${selectedDistrictFlow.net.toFixed(1)} de balance neto, ${selectedDistrictFlow.inbound.toFixed(0)} entradas estimadas y ${selectedDistrictFlow.outbound.toFixed(0)} salidas estimadas.`}
                  </>
                ) : (
                  'No hay un barrio de referencia disponible para este periodo.'
                )}
              </div>
            </Card>
          </div>

          <Card className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-6">
            <h3 className="text-base font-bold text-[var(--foreground)]">Balance neto por barrio</h3>
            <div className="mt-4 space-y-5">
              {activeInsights.districts.map((district) => {
                const net = district.net;
                const maxMagnitude = Math.max(1, district.volume);
                const width = Math.min(50, (Math.abs(net) / maxMagnitude) * 100);
                const isImporter = net >= 0;

                return (
                  <div key={district.district}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--foreground)]">{district.district}</span>
                      <span className={`font-black ${isImporter ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {net >= 0 ? '+' : ''}
                        {net.toFixed(1)}
                      </span>
                    </div>
                    <div className="relative h-3 w-full rounded-full bg-black/20">
                      {isImporter ? (
                        <div
                          className="absolute left-1/2 h-full rounded-r-full bg-emerald-500"
                          style={{ width: `${width}%` }}
                        />
                      ) : (
                        <div
                          className="absolute right-1/2 h-full rounded-l-full bg-rose-500"
                          style={{ width: `${width}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              <span>Emisor neto</span>
              <span>Neutro</span>
              <span>Receptor neto</span>
            </div>
          </Card>

          <Card className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--foreground)]">Matriz origen-destino</h3>
              <span className="text-[10px] text-[var(--muted)]">Datos en vivo</span>
            </div>

            {activeInsights.districts.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">Sin volumen suficiente.</p>
            ) : (
              <ScrollArea className="mt-3 max-h-[420px]">
                <Table className="min-w-full border-collapse text-[11px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-10 h-auto bg-[var(--card)] px-2 py-2 text-left font-semibold normal-case tracking-normal text-[var(--muted)]">
                        O \ D
                      </TableHead>
                      {activeInsights.districts.map((district) => (
                        <TableHead
                          key={`dest-${district.district}`}
                          className="h-auto px-2 py-2 text-left font-semibold normal-case tracking-normal text-[var(--muted)]"
                        >
                          {district.district}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeInsights.districts.map((origin, originIndex) => (
                      <TableRow key={`origin-${origin.district}`}>
                        <TableCell className="sticky left-0 bg-[var(--card)] px-2 py-2 font-semibold text-[var(--foreground)]">
                          {origin.district}
                        </TableCell>
                        {activeInsights.matrix[originIndex]?.map((value, destinationIndex) => (
                          <TableCell
                            key={`${originIndex}-${destinationIndex}`}
                            className="border border-[var(--border)] px-2 py-2 text-right"
                            style={{
                              backgroundColor: getMatrixCellColor(value, activeInsights.maxFlow),
                              color:
                                value / (activeInsights.maxFlow || 1) > 0.5
                                  ? '#ffffff'
                                  : 'var(--foreground)',
                            }}
                          >
                            {value.toFixed(1)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </Card>

          <Card className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 xl:col-span-12">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">Curva diaria de demanda</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Muestra como cambia la actividad diaria y la ocupacion media en el periodo activo.
                </p>
              </div>
              <div className="text-right text-xs text-[var(--muted)]">
                <span>{mobilityData.demandDays} dias</span>
                <div>
                  <Link
                    href={appRoutes.dashboardHelp('demanda-no-viajes-reales')}
                    className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    Entender curva
                  </Link>
                </div>
              </div>
            </div>
            {dailyCurveData.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">Sin datos de demanda diaria.</p>
            ) : (
              <>
                <ChartWrapper height="h-[260px]">
                  <div className="mt-3 h-[260px]">
                    <MeasuredResponsiveContainer>
                      <AreaChart data={dailyCurveData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(234, 6, 21, 0.22)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={14} />
                        <YAxis yAxisId="score" tick={{ fontSize: 11 }} width={42} />
                        <YAxis
                          yAxisId="occ"
                          orientation="right"
                          tick={{ fontSize: 11 }}
                          width={38}
                          tickFormatter={(value) => formatPercent(value as number)}
                        />
                        <Tooltip
                          formatter={(
                            value: number | string | ReadonlyArray<number | string> | undefined,
                            name: string | number | undefined
                          ) => {
                            const numericValue = Array.isArray(value)
                              ? Number(value[0])
                              : Number(value);

                            if (name === 'Demanda') {
                              return [numericValue.toFixed(1), 'Demanda'];
                            }

                            return [formatPercent(numericValue), 'Ocupacion media'];
                          }}
                        />
                        <Area
                          yAxisId="score"
                          type="monotone"
                          dataKey="demandScore"
                          name="Demanda"
                          stroke="#ea0615"
                          fill="rgba(234, 6, 21, 0.26)"
                          strokeWidth={2}
                        />
                        <Area
                          yAxisId="occ"
                          type="monotone"
                          dataKey="avgOccupancyRatio"
                          name="Ocupacion"
                          stroke="#14b8a6"
                          fill="rgba(20, 184, 166, 0.2)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </MeasuredResponsiveContainer>
</div>
                </ChartWrapper>
                <p className='text-[11px] text-[var(--muted)]'>{mobilityData.methodology}</p>
              </>
            )}
          </Card>
        </div>
      ) : null}
    </section>
  );
}

export function MobilityInsights(props: MobilityInsightsProps) {
  return (
    <Suspense fallback={<div className='ui-section-card h-96 animate-pulse' />}>
      <MobilityInsightsContent {...props} />
    </Suspense>
  );
}
