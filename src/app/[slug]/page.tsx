import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getDailyDemandCurve,
  getHourlyMobilitySignals,
  getMonthlyDemandCurve,
  getSystemHourlyProfile,
} from '@/analytics/queries/read';
import {
  fetchAvailableDataMonths,
  fetchRankings,
  fetchStations,
  type RankingRow,
  type StationSnapshot,
} from '@/lib/api';
import { formatMonthLabel } from '@/lib/months';
import {
  getDailyMobilityConclusions,
  type MobilityConclusionsPayload,
} from '@/lib/mobility-conclusions';
import { getDistrictSeoRows } from '@/lib/seo-districts';
import { buildPageMetadata } from '@/lib/seo';
import { getSeoPageConfig, isSeoPageSlug, SEO_PAGE_SLUGS, type SeoPageSlug } from '@/lib/seo-pages';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const dynamicParams = false;
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

type EnrichedRankingRow = RankingRow & {
  stationName: string;
  currentBikes: number | null;
  currentAnchors: number | null;
  capacity: number | null;
};

type MonthlySeriesRow = {
  monthKey: string;
  demandScore: number;
  avgOccupancy: number;
  activeStations: number;
  sampleCount: number;
};

const EMPTY_MONTHLY_REPORT: MobilityConclusionsPayload = {
  dateKey: new Date().toISOString().slice(0, 10),
  generatedAt: new Date().toISOString(),
  selectedMonth: null,
  sourceFirstDay: null,
  sourceLastDay: null,
  totalHistoricalDays: 0,
  stationsWithData: 0,
  activeStations: 0,
  summary: 'Todavia no hay historico suficiente para publicar un informe mensual.',
  highlights: [],
  recommendations: [],
  topStationsByDemand: [] as Array<{ stationId: string; stationName: string; avgDemand: number }>,
  leastUsedStations: [] as Array<{ stationId: string; stationName: string; avgDemand: number }>,
  peakDemandHours: [] as Array<{ hour: number; demandScore: number }>,
  topDistrictsByDemand: [] as Array<{ district: string; demandScore: number }>,
  metrics: {
    demandLast7Days: 0,
    demandPrevious7Days: 0,
    demandDeltaRatio: null as number | null,
    occupancyLast7Days: 0,
    occupancyPrevious7Days: 0,
    occupancyDeltaRatio: null as number | null,
  },
  weekdayWeekendProfile: {
    weekday: { avgDemand: 0, avgOccupancy: 0, daysCount: 0 },
    weekend: { avgDemand: 0, avgOccupancy: 0, daysCount: 0 },
    demandGapRatio: null,
    dominantPeriod: null,
  },
};

function formatInteger(value: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
}

function formatDecimal(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits }).format(value);
}

function formatPercent(value: number | null, digits = 0): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Sin datos';
  }

  return new Intl.NumberFormat('es-ES', {
    style: 'percent',
    maximumFractionDigits: digits,
  }).format(value);
}

function formatDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Sin referencia';
  }

  const rounded = Math.round(value * 100);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

function formatHourLabel(hour: number): string {
  const nextHour = (hour + 1) % 24;
  return `${String(hour).padStart(2, '0')}:00-${String(nextHour).padStart(2, '0')}:00`;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function enrichRankings(rankings: RankingRow[], stations: StationSnapshot[]): EnrichedRankingRow[] {
  const stationMap = new Map(stations.map((station) => [station.id, station]));

  return rankings.map((row) => {
    const station = stationMap.get(row.stationId);

    return {
      ...row,
      stationName: station?.name ?? `Estacion ${row.stationId}`,
      currentBikes: station?.bikesAvailable ?? null,
      currentAnchors: station?.anchorsFree ?? null,
      capacity: station?.capacity ?? null,
    };
  });
}

function buildDailyComparative(series: Array<{ day: string; demandScore: number }>) {
  const last7 = series.slice(-7);
  const previous7 = series.slice(-14, -7);
  const last7Total = sum(last7.map((row) => row.demandScore));
  const previous7Total = sum(previous7.map((row) => row.demandScore));

  return {
    last7Total,
    previous7Total,
    deltaRatio:
      previous7Total > 0 ? (last7Total - previous7Total) / previous7Total : null,
  };
}

function buildMonthlyComparative(series: MonthlySeriesRow[]) {
  const latest = series.at(-1) ?? null;
  const previous = series.at(-2) ?? null;

  return {
    latest,
    previous,
    deltaRatio:
      latest && previous && previous.demandScore > 0
        ? (latest.demandScore - previous.demandScore) / previous.demandScore
        : null,
  };
}

function buildStationUrl(stationId: string): string {
  return `/dashboard/estaciones/${encodeURIComponent(stationId)}`;
}

export function generateStaticParams() {
  return SEO_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isSeoPageSlug(slug)) {
    return {};
  }

  const config = getSeoPageConfig(slug);

  return buildPageMetadata({
    title: config.metadataTitle,
    description: config.description,
    path: `/${config.slug}`,
    keywords: config.keywords,
  });
}

function SeoPageNav({ activeSlug }: { activeSlug: SeoPageSlug }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {SEO_PAGE_SLUGS.map((slug) => {
        const config = getSeoPageConfig(slug);
        const isActive = slug === activeSlug;

        return (
          <Link
            key={slug}
            href={`/${slug}`}
            className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
              isActive
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]'
            }`}
          >
            {config.title}
          </Link>
        );
      })}
    </nav>
  );
}

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-black text-[var(--foreground)] md:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
      </div>
    </div>
  );
}

function renderUsageRanking(rows: EnrichedRankingRow[]) {
  return rows.slice(0, 10).map((row, index) => (
    <Link
      key={`${row.stationId}-${index}`}
      href={buildStationUrl(row.stationId)}
      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {index + 1}. {row.stationName}
        </p>
        <p className="text-[11px] text-[var(--muted)]">
          {row.currentBikes ?? 0} bicis ahora · {row.currentAnchors ?? 0} anclajes libres
        </p>
      </div>
      <p className="text-xs font-bold text-[var(--foreground)]">
        {formatInteger(row.turnoverScore)} pts
      </p>
    </Link>
  ));
}

function renderStationDemandList(
  rows: Array<{ stationId: string; stationName: string; avgDemand: number }>,
  tone: 'accent' | 'neutral'
) {
  return rows.map((row, index) => (
    <Link
      key={`${row.stationId}-${index}`}
      href={buildStationUrl(row.stationId)}
      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {index + 1}. {row.stationName}
        </p>
        <p className="text-[11px] text-[var(--muted)]">Detalle completo de estacion y patrones horarios</p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          tone === 'accent'
            ? 'bg-[var(--accent)]/12 text-[var(--accent)]'
            : 'bg-[var(--foreground)]/8 text-[var(--foreground)]'
        }`}
      >
        {formatDecimal(row.avgDemand)} pts/dia
      </span>
    </Link>
  ));
}

function renderPageBody(
  slug: SeoPageSlug,
  data: {
    stations: StationSnapshot[];
    turnoverRankings: EnrichedRankingRow[];
    availabilityRankings: EnrichedRankingRow[];
    dailyDemand: Array<{ day: string; demandScore: number; avgOccupancy: number; sampleCount: number }>;
    monthlyDemand: MonthlySeriesRow[];
    hourlyActivity: Array<{ hour: number; activity: number }>;
    systemHourlyProfile: Array<{ hour: number; avgOccupancy: number; bikesInCirculation: number; sampleCount: number }>;
    monthlyReport: MobilityConclusionsPayload;
    latestMonth: string | null;
    districtRows: Awaited<ReturnType<typeof getDistrictSeoRows>>;
  }
) {
  const dailyComparative = buildDailyComparative(data.dailyDemand);
  const monthlyComparative = buildMonthlyComparative(data.monthlyDemand);
  const activeStations = data.stations.length;
  const topCurrentBikes = [...data.stations]
    .sort((left, right) => right.bikesAvailable - left.bikesAvailable || left.name.localeCompare(right.name, 'es'))
    .slice(0, 10);
  const currentBikeAverage = average(data.stations.map((station) => station.bikesAvailable));
  const topTurnoverAverage = average(data.turnoverRankings.slice(0, 5).map((row) => row.turnoverScore));
  const nextTurnoverAverage = average(data.turnoverRankings.slice(5, 10).map((row) => row.turnoverScore));
  const topAvailabilityRisk = data.availabilityRankings[0] ?? null;
  const peakHourlyActivity = [...data.hourlyActivity].sort((left, right) => right.activity - left.activity)[0] ?? null;
  const topOccupancyHour = [...data.systemHourlyProfile].sort(
    (left, right) => right.avgOccupancy - left.avgOccupancy
  )[0] ?? null;
  const topDistrictRow = data.districtRows[0] ?? null;

  switch (slug) {
    case 'estaciones-mas-usadas-zaragoza':
      return (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="dashboard-card">
              <p className="stat-label">Top 5 vs siguientes 5</p>
              <p className="stat-value">{formatDecimal(topTurnoverAverage)}</p>
              <p className="text-xs text-[var(--muted)]">
                Los siguientes cinco se quedan en {formatDecimal(nextTurnoverAverage)} puntos medios de uso.
              </p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Estacion lider</p>
              <p className="stat-value">{data.turnoverRankings[0]?.stationName ?? 'Sin datos'}</p>
              <p className="text-xs text-[var(--muted)]">
                {data.turnoverRankings[0]
                  ? `${formatInteger(data.turnoverRankings[0].turnoverScore)} puntos de actividad reciente.`
                  : 'Aun no hay ranking consolidado.'}
              </p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Riesgo operativo</p>
              <p className="stat-value">{topAvailabilityRisk?.stationName ?? 'Sin datos'}</p>
              <p className="text-xs text-[var(--muted)]">
                {topAvailabilityRisk
                  ? `${topAvailabilityRisk.emptyHours + topAvailabilityRisk.fullHours} horas criticas entre vaciado y saturacion.`
                  : 'Sin comparativa de disponibilidad.'}
              </p>
            </article>
          </section>

          <section className="dashboard-card">
            <SectionTitle
              title="Ranking reciente de estaciones mas usadas"
              detail="Este listado usa el indice de rotacion reciente del sistema para detectar donde hay mas intercambio de bicicletas y anclajes."
            />
            <div className="mt-2 space-y-3">{renderUsageRanking(data.turnoverRankings)}</div>
          </section>
        </>
      );
    case 'barrios-bizi-zaragoza':
      return (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="dashboard-card">
              <p className="stat-label">Barrio lider</p>
              <p className="stat-value">{topDistrictRow?.name ?? 'Sin datos'}</p>
              <p className="text-xs text-[var(--muted)]">
                {topDistrictRow
                  ? `${formatDecimal(topDistrictRow.avgTurnover)} puntos medios de rotacion por estacion.`
                  : 'Aun no hay comparativa por barrios.'}
              </p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Mas bicis en barrio</p>
              <p className="stat-value">{topDistrictRow ? formatInteger(topDistrictRow.bikesAvailable) : 'Sin datos'}</p>
              <p className="text-xs text-[var(--muted)]">Disponibilidad agregada actual en el barrio con mayor intensidad reciente.</p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Cobertura</p>
              <p className="stat-value">{formatInteger(data.districtRows.length)}</p>
              <p className="text-xs text-[var(--muted)]">Barrios con estaciones mapeadas y comparables en esta capa SEO.</p>
            </article>
          </section>

          <section className="dashboard-card">
            <SectionTitle
              title="Comparativa de barrios con uso de Bizi"
              detail="Cada barrio resume estaciones activas, bicicletas disponibles y una media reciente de rotacion para enlazar a su ficha SEO propia."
            />
            <div className="mt-2 space-y-3">
              {data.districtRows.map((district) => (
                <Link
                  key={district.slug}
                  href={`/barrios/${district.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{district.name}</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {district.stationCount} estaciones · {district.bikesAvailable} bicis actuales · riesgo medio {formatDecimal(district.avgAvailabilityRisk)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent)]/12 px-3 py-1 text-xs font-bold text-[var(--accent)]">
                    {formatDecimal(district.avgTurnover)} pts
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      );
    case 'ranking-estaciones-bizi':
      return (
        <section className="grid gap-4 xl:grid-cols-2">
          <article className="dashboard-card">
            <SectionTitle
              title="Estaciones con mas actividad"
              detail="Top de estaciones por intensidad reciente de uso, util para detectar hubs de entrada y salida."
            />
            <div className="mt-2 space-y-3">{renderUsageRanking(data.turnoverRankings)}</div>
          </article>
          <article className="dashboard-card">
            <SectionTitle
              title="Estaciones con mas horas criticas"
              detail="Suma de horas casi vacias o casi llenas para localizar puntos con mayor friccion operativa."
            />
            <div className="mt-2 space-y-3">{renderUsageRanking(data.availabilityRankings)}</div>
          </article>
        </section>
      );
    case 'estaciones-con-mas-bicis':
      return (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="dashboard-card">
              <p className="stat-label">Media actual del sistema</p>
              <p className="stat-value">{formatDecimal(currentBikeAverage, 0)} bicis</p>
              <p className="text-xs text-[var(--muted)]">Promedio de bicicletas disponibles por estacion activa.</p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Estacion con mas bicis</p>
              <p className="stat-value">{topCurrentBikes[0]?.name ?? 'Sin datos'}</p>
              <p className="text-xs text-[var(--muted)]">
                {topCurrentBikes[0]
                  ? `${topCurrentBikes[0].bikesAvailable} bicis disponibles ahora mismo.`
                  : 'Sin snapshot actual.'}
              </p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Estaciones activas</p>
              <p className="stat-value">{formatInteger(activeStations)}</p>
              <p className="text-xs text-[var(--muted)]">Cobertura actual del sistema Bizi Zaragoza.</p>
            </article>
          </section>

          <section className="dashboard-card">
            <SectionTitle
              title="Estaciones con mas bicicletas disponibles ahora"
              detail="Snapshot pensado para SEO y consulta rapida, con enlace al detalle operativo de cada estacion."
            />
            <div className="mt-2 space-y-3">
              {topCurrentBikes.map((station, index) => (
                <Link
                  key={station.id}
                  href={buildStationUrl(station.id)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {index + 1}. {station.name}
                    </p>
                    <p className="text-[11px] text-[var(--muted)]">
                      Capacidad {station.capacity} · {station.anchorsFree} anclajes libres
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent)]/12 px-3 py-1 text-xs font-bold text-[var(--accent)]">
                    {station.bikesAvailable} bicis
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      );
    case 'uso-bizi-por-hora':
      return (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="dashboard-card">
              <p className="stat-label">Hora con mas actividad</p>
              <p className="stat-value">{peakHourlyActivity ? formatHourLabel(peakHourlyActivity.hour) : 'Sin datos'}</p>
              <p className="text-xs text-[var(--muted)]">
                {peakHourlyActivity
                  ? `${formatDecimal(peakHourlyActivity.activity)} movimientos medios estimados por hora.`
                  : 'Todavia no hay historico horario suficiente.'}
              </p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Mayor ocupacion media</p>
              <p className="stat-value">{topOccupancyHour ? formatHourLabel(topOccupancyHour.hour) : 'Sin datos'}</p>
              <p className="text-xs text-[var(--muted)]">
                {topOccupancyHour
                  ? `${formatPercent(topOccupancyHour.avgOccupancy)} de ocupacion media del sistema.`
                  : 'Sin perfil horario agregado.'}
              </p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Comparativa semanal</p>
              <p className="stat-value">{formatDelta(dailyComparative.deltaRatio)}</p>
              <p className="text-xs text-[var(--muted)]">Cambio de actividad de los ultimos 7 dias frente a la semana anterior.</p>
            </article>
          </section>

          <section className="dashboard-card">
            <SectionTitle
              title="Perfil horario del uso de Bizi"
              detail="Se agrupan salidas y llegadas horarias estimadas para mostrar las franjas con mas presion operativa."
            />
            <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.hourlyActivity.map((row) => {
                const occupancy = data.systemHourlyProfile.find((item) => item.hour === row.hour);

                return (
                  <article key={row.hour} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{formatHourLabel(row.hour)}</p>
                    <p className="mt-2 text-lg font-black text-[var(--foreground)]">{formatDecimal(row.activity)}</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      Ocupacion media {formatPercent(occupancy?.avgOccupancy ?? null)} · {formatDecimal(occupancy?.bikesInCirculation ?? 0, 0)} bicis medias en red
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      );
    case 'viajes-por-dia-zaragoza':
      return (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="dashboard-card">
              <p className="stat-label">Ultimos 7 dias</p>
              <p className="stat-value">{formatInteger(dailyComparative.last7Total)} pts</p>
              <p className="text-xs text-[var(--muted)]">Indice agregado de viajes estimados, no conteo exacto de trayectos individuales.</p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Comparativa semanal</p>
              <p className="stat-value">{formatDelta(dailyComparative.deltaRatio)}</p>
              <p className="text-xs text-[var(--muted)]">Frente a los 7 dias inmediatamente anteriores.</p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Dia mas intenso</p>
              <p className="stat-value">{data.dailyDemand.slice().sort((a, b) => b.demandScore - a.demandScore)[0]?.day ?? 'Sin datos'}</p>
              <p className="text-xs text-[var(--muted)]">Pico diario reciente dentro de la serie visible.</p>
            </article>
          </section>

          <section className="dashboard-card">
            <SectionTitle
              title="Serie diaria de viajes estimados"
              detail="Cada punto resume la actividad agregada diaria del sistema usando la variacion de bicicletas y anclajes por estacion."
            />
            <div className="mt-2 space-y-3">
              {data.dailyDemand.slice(-30).reverse().map((row) => (
                <article
                  key={row.day}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{row.day}</p>
                    <p className="text-[11px] text-[var(--muted)]">Ocupacion media {formatPercent(row.avgOccupancy)}</p>
                  </div>
                  <span className="rounded-full bg-[var(--accent)]/12 px-3 py-1 text-xs font-bold text-[var(--accent)]">
                    {formatInteger(row.demandScore)} pts
                  </span>
                </article>
              ))}
            </div>
          </section>
        </>
      );
    case 'viajes-por-mes-zaragoza':
      return (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="dashboard-card">
              <p className="stat-label">Ultimo mes consolidado</p>
              <p className="stat-value">
                {monthlyComparative.latest ? formatMonthLabel(monthlyComparative.latest.monthKey) : 'Sin datos'}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {monthlyComparative.latest
                  ? `${formatInteger(monthlyComparative.latest.demandScore)} puntos de demanda estimada.`
                  : 'Aun no hay meses consolidados.'}
              </p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Vs mes anterior</p>
              <p className="stat-value">{formatDelta(monthlyComparative.deltaRatio)}</p>
              <p className="text-xs text-[var(--muted)]">Comparativa del mes mas reciente frente al inmediatamente anterior.</p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Ocupacion media del mes</p>
              <p className="stat-value">{formatPercent(monthlyComparative.latest?.avgOccupancy ?? null)}</p>
              <p className="text-xs text-[var(--muted)]">Promedio de ocupacion en el ultimo mes disponible.</p>
            </article>
          </section>

          <section className="dashboard-card">
            <SectionTitle
              title="Evolucion mensual estimada"
              detail="Base para informes mensuales y paginas evergreen enlazadas al dashboard con filtro por mes."
            />
            <div className="mt-2 space-y-3">
              {data.monthlyDemand.slice().reverse().map((row) => (
                <Link
                  key={row.monthKey}
                  href={`/dashboard/conclusiones?month=${row.monthKey}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{formatMonthLabel(row.monthKey)}</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {row.activeStations} estaciones activas · ocupacion media {formatPercent(row.avgOccupancy)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent)]/12 px-3 py-1 text-xs font-bold text-[var(--accent)]">
                    {formatInteger(row.demandScore)} pts
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      );
    case 'uso-bizi-por-estacion':
      return (
        <section className="grid gap-4 xl:grid-cols-2">
          <article className="dashboard-card">
            <SectionTitle
              title="Estaciones con mayor demanda media"
              detail="Comparativa util para identificar estaciones tractoras del sistema y acceder al detalle de cada una."
            />
            <div className="mt-2 space-y-3">
              {renderStationDemandList(data.monthlyReport.topStationsByDemand, 'accent')}
            </div>
          </article>
          <article className="dashboard-card">
            <SectionTitle
              title="Estaciones menos usadas"
              detail="Sirve para detectar bolsas de menor actividad y compararlas con las estaciones mas intensas."
            />
            <div className="mt-2 space-y-3">
              {renderStationDemandList(data.monthlyReport.leastUsedStations, 'neutral')}
            </div>
          </article>
        </section>
      );
    case 'informes-mensuales-bizi-zaragoza':
      return (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="dashboard-card">
              <p className="stat-label">Ultimo informe</p>
              <p className="stat-value">{data.latestMonth ? formatMonthLabel(data.latestMonth) : 'Sin datos'}</p>
              <p className="text-xs text-[var(--muted)]">Cada enlace abre el dashboard con el mes ya filtrado.</p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Resumen ejecutivo</p>
              <p className="stat-value">{formatDelta(data.monthlyReport.metrics.demandDeltaRatio)}</p>
              <p className="text-xs text-[var(--muted)]">Variacion del periodo mas reciente frente al anterior comparable.</p>
            </article>
            <article className="dashboard-card">
              <p className="stat-label">Distritos destacados</p>
              <p className="stat-value">{data.monthlyReport.topDistrictsByDemand[0]?.district ?? 'Sin datos'}</p>
              <p className="text-xs text-[var(--muted)]">Zona con mayor intensidad agregada en el ultimo informe disponible.</p>
            </article>
          </section>

          <section className="dashboard-card">
            <SectionTitle
              title="Archivo de informes mensuales"
              detail="Pensado para SEO, indexacion por bots y navegacion editorial hacia el dashboard analitico."
            />
            <div className="mt-2 space-y-3">
              {data.monthlyDemand.slice().reverse().map((row) => (
                <Link
                  key={row.monthKey}
                  href={`/dashboard/conclusiones?month=${row.monthKey}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">Informe de {formatMonthLabel(row.monthKey)}</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {formatInteger(row.demandScore)} pts · ocupacion {formatPercent(row.avgOccupancy)} · {row.activeStations} estaciones
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[var(--accent)]">Abrir informe</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      );
  }
}

export default async function SeoLandingPage({ params }: PageProps) {
  const { slug } = await params;

  if (!isSeoPageSlug(slug)) {
    notFound();
  }

  const config = getSeoPageConfig(slug);
  const siteUrl = getSiteUrl();
  const stationsResponse = await fetchStations().catch(() => ({ stations: [], generatedAt: new Date().toISOString() }));
  const [turnoverResponse, availabilityResponse, dailyDemand, hourlySignals, systemHourlyProfile, monthlyDemand, availableMonths, districtRows] =
    await Promise.all([
      fetchRankings('turnover', 20).catch(() => ({ type: 'turnover' as const, limit: 20, rankings: [], generatedAt: new Date().toISOString() })),
      fetchRankings('availability', 20).catch(() => ({ type: 'availability' as const, limit: 20, rankings: [], generatedAt: new Date().toISOString() })),
      getDailyDemandCurve(90).catch(() => []),
      getHourlyMobilitySignals(30).catch(() => []),
      getSystemHourlyProfile(30).catch(() => []),
      getMonthlyDemandCurve(12).catch(() => []),
      fetchAvailableDataMonths().catch(() => ({ months: [], generatedAt: new Date().toISOString() })),
      getDistrictSeoRows().catch(() => []),
    ]);

  const latestMonth = availableMonths.months[0] ?? monthlyDemand.at(-1)?.monthKey ?? null;
  const monthlyReport = latestMonth
    ? await getDailyMobilityConclusions(latestMonth)
        .then((result) => result.payload)
        .catch(() => EMPTY_MONTHLY_REPORT)
    : EMPTY_MONTHLY_REPORT;

  const hourlyByHour = new Map<number, number>();

  for (const row of hourlySignals) {
    const current = hourlyByHour.get(row.hour) ?? 0;
    hourlyByHour.set(row.hour, current + Number(row.departures) + Number(row.arrivals));
  }

  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    activity: Number((hourlyByHour.get(hour) ?? 0).toFixed(1)),
  }));

  const enrichedTurnover = enrichRankings(turnoverResponse.rankings, stationsResponse.stations);
  const enrichedAvailability = enrichRankings(availabilityResponse.rankings, stationsResponse.stations);
  const generatedAt = [
    stationsResponse.generatedAt,
    turnoverResponse.generatedAt,
    availabilityResponse.generatedAt,
  ]
    .filter(Boolean)
    .sort()
    .at(-1) ?? new Date().toISOString();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: config.title, item: `${siteUrl}/${slug}` },
        ],
      },
      {
        '@type': slug === 'informes-mensuales-bizi-zaragoza' ? 'Report' : 'Dataset',
        name: config.title,
        description: config.description,
        url: `${siteUrl}/${slug}`,
        inLanguage: 'es',
        dateModified: generatedAt,
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
        isPartOf: {
          '@type': 'WebSite',
          name: SITE_NAME,
          url: siteUrl,
        },
      },
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="hero-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{config.heroKicker}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">{config.title}</h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">{config.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">{config.cadenceLabel}</span>
            <span className="kpi-chip">Actualizado {new Date(generatedAt).toLocaleDateString('es-ES')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={config.dashboardHref}
            className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            {config.dashboardLabel}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Abrir dashboard en tiempo real
          </Link>
        </div>
      </header>

      <SeoPageNav activeSlug={slug} />

      {renderPageBody(slug, {
        stations: stationsResponse.stations,
        turnoverRankings: enrichedTurnover,
        availabilityRankings: enrichedAvailability,
        dailyDemand,
        monthlyDemand,
        hourlyActivity,
        systemHourlyProfile: systemHourlyProfile.map((row) => ({
          hour: Number(row.hour),
          avgOccupancy: Number(row.avgOccupancy),
          bikesInCirculation: Number(row.bikesInCirculation),
          sampleCount: Number(row.sampleCount),
        })),
        monthlyReport,
        latestMonth,
        districtRows,
      })}

      <section className="dashboard-card">
        <SectionTitle
          title="Rutas relacionadas"
          detail="Refuerza la navegacion interna entre rankings, informes mensuales y dashboard filtrado."
        />
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/informes"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Archivo de informes mensuales</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Historico indexable con enlaces persistentes por mes.</p>
          </Link>
          {latestMonth ? (
            <Link
              href={`/informes/${latestMonth}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">Ultimo informe disponible</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">Abrir informe mensual de {formatMonthLabel(latestMonth)}.</p>
            </Link>
          ) : null}
          <Link
            href="/dashboard/conclusiones"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Conclusiones del dashboard</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Vista ejecutiva con filtros por mes y comparativas operativas.</p>
          </Link>
          <Link
            href="/dashboard/estaciones"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Directorio de estaciones</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Profundiza en el detalle de cada estacion enlazada desde las landings.</p>
          </Link>
        </div>
      </section>

      <section className="dashboard-card">
        <SectionTitle
          title="Como interpretar esta pagina"
          detail="Las metricas de viajes y demanda representan un indice agregado derivado del historico de estaciones; sirven para comparativas SEO y operativas, no como conteo exacto de trayectos individuales."
        />
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Serie diaria</p>
            <p className="text-[11px] text-[var(--muted)]">Ideal para detectar picos, caidas semanales y cambios recientes.</p>
          </article>
          <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Serie mensual</p>
            <p className="text-[11px] text-[var(--muted)]">Sirve como base de informes mensuales y comparativas intermensuales.</p>
          </article>
          <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Detalle operativo</p>
            <p className="text-[11px] text-[var(--muted)]">Cada listado conecta con el dashboard o la ficha de estacion para profundizar.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
