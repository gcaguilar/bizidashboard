/**
 * Constructores puros de stories y carruseles.
 *
 * Reciben hechos ya consultados (snapshot, distritos, alertas, informe
 * mensual...) y devuelven el contrato de `types.ts`. No tocan base de datos,
 * red ni relojes: la fecha y la ventana llegan en el input. Los constructores
 * toleran arrays vacios y devuelven `null` cuando no hay material suficiente;
 * el llamante decide saltar el slot antes de renderizar.
 */

import { ANALYTICS_WINDOWS } from '@/analytics/types';
import { activityIndexUnits } from '@/lib/product-copy';
import {
  formatDecimal,
  formatInteger,
  formatPercent,
  formatRatioDelta,
} from '@/lib/format';
import { formatMonthLabel, formatMonthName } from '@/lib/months';
import {
  buildFeedCaption,
  buildSocialAltText,
  buildStoryText,
  formatAvailabilityIssue,
  formatGrowthFact,
  formatGrowthMagnitude,
  formatSocialMonthLabel,
  formatSocialWeekLabel,
  getDayFraming,
  pluralize,
  SOCIAL_AFTERNOON_WINDOW,
  SOCIAL_FEED_CTA,
  SOCIAL_FEED_FOOTER,
  SOCIAL_MORNING_WINDOW,
  SOCIAL_STORY_FOOTER,
} from '@/lib/social/copy';
import {
  topDistrictsByActivity,
  topDistrictsByFriction,
  topDistrictsByGrowth,
} from '@/lib/social/data';
import type {
  SocialBar,
  SocialCarousel,
  SocialCarouselSlide,
  SocialCause,
  SocialDistrictStats,
  SocialNetworkContext,
  SocialStationCandidate,
  SocialStationSelection,
  SocialStory,
  SocialStoryFact,
  SocialWeekRange,
} from '@/lib/social/types';
import type { MonthlyReport, ReportTrend } from '@/lib/monthly-report-types';

const ACCENT_TEAL = '#0f766e';
const ACCENT_AMBER = '#b45309';
const ACCENT_RED = '#b91c1c';
const ACCENT_BLUE = '#1d4ed8';
const ACCENT_SLATE = '#64748b';

function normalize(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

function compareText(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function bikesLabel(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
  return `${formatInteger(safe)} ${pluralize(safe, 'bici', 'bicis')}`;
}

function networkFact(network: SocialNetworkContext): SocialStoryFact | null {
  if (!network || network.totalStations <= 0) {
    return null;
  }

  const critical = Math.max(0, network.criticalStationsCount);
  const label = normalize(network.label) || 'Red sin valorar';

  return {
    label: 'Red',
    value: `${label} · ${formatInteger(critical)} de ${formatInteger(network.totalStations)} sin bicis o huecos`,
  };
}

function causeFact(cause?: SocialCause | null): SocialStoryFact | null {
  return cause?.label ? { label: 'Contexto', value: normalize(cause.label) } : null;
}

function districtFact(districts: readonly SocialDistrictStats[]): SocialStoryFact | null {
  const top = topDistrictsByActivity(districts, 2);
  if (top.length === 0) {
    return null;
  }

  return {
    label: 'Movimiento por zonas',
    value: top.map((entry) => normalize(entry.district)).join(' · '),
  };
}

function districtBars(
  districts: readonly SocialDistrictStats[],
  limit = 3,
  preferred?: (entry: SocialDistrictStats) => number
): SocialBar[] {
  return topDistrictsByActivity(districts, limit)
    .map((entry) => ({
      label: normalize(entry.district),
      value: preferred ? preferred(entry) : entry.activityIndex,
    }))
    .filter((bar) => Number.isFinite(bar.value) && bar.value > 0);
}

function compactFacts(facts: Array<SocialStoryFact | null>): SocialStoryFact[] {
  return facts.filter((fact): fact is SocialStoryFact => fact !== null);
}

/* -------------------------------------------------------------------------- */
/* Mañana                                                                     */
/* -------------------------------------------------------------------------- */

export type SocialMorningStoryInput = {
  dateKey: string;
  selection: SocialStationSelection<SocialStationCandidate>;
  topDistricts?: readonly SocialDistrictStats[];
  network: SocialNetworkContext;
  cause?: SocialCause | null;
  /** Ventana real de datos; por defecto, 07:00–08:30. */
  dataWindow?: string;
};

function morningStationFact(selection: SocialStationSelection<SocialStationCandidate>): SocialStoryFact {
  if (selection.stations.length === 0) {
    return {
      label: 'Estaciones clave',
      value:
        selection.mode === 'none'
          ? 'Sin agotadas ni poca disponibilidad'
          : 'Sin estaciones para destacar',
    };
  }

  const stations = selection.stations.slice(0, 3).map((station) => {
    const name = normalize(station.name);
    return `${name} (${bikesLabel(station.bikesAvailable)})`;
  });

  return {
    label:
      selection.mode === 'empty'
        ? 'Estaciones clave agotadas'
        : selection.mode === 'low'
          ? 'Estaciones clave con poca disponibilidad'
          : 'Estaciones clave',
    value: stations.join(' · '),
  };
}

function morningHeadline(selection: SocialStationSelection<SocialStationCandidate>): string {
  const count = selection.stations.length;

  if (selection.mode === 'empty' && count > 0) {
    return `${formatInteger(count)} ${pluralize(count, 'estación clave', 'estaciones clave')} ${pluralize(count, 'agotada', 'agotadas')}`;
  }

  if (selection.mode === 'low' && count > 0) {
    return `${formatInteger(count)} ${pluralize(count, 'estación clave', 'estaciones clave')} con poca disponibilidad`;
  }

  return 'Sin agotadas entre las estaciones clave';
}

/**
 * Story de las 08:30. Titular segun el modo de seleccion (agotadas, poca
 * disponibilidad o ninguna), hechos de estaciones clave, zonas con mas
 * movimiento estimado y contexto de red. Devuelve `null` si no hay ni
 * estaciones, ni distritos, ni red.
 */
export function buildMorningStory(input: SocialMorningStoryInput): SocialStory | null {
  const stations = input.selection.stations ?? [];
  const districts = input.topDistricts ?? [];
  const network = input.network;

  if (stations.length === 0 && districts.length === 0 && network.totalStations <= 0) {
    return null;
  }

  const framing = getDayFraming(input.dateKey);
  const dataWindow = input.dataWindow ?? SOCIAL_MORNING_WINDOW;
  const facts = compactFacts([
    morningStationFact(input.selection),
    districtFact(districts),
    networkFact(network),
    causeFact(input.cause),
  ]);

  const headline = morningHeadline(input.selection);
  const accent =
    input.selection.mode === 'empty'
      ? ACCENT_RED
      : input.selection.mode === 'low'
        ? ACCENT_AMBER
        : ACCENT_TEAL;
  const bars = districtBars(districts, 3);

  return {
    slot: 'morning',
    family: 'daily-story',
    dateKey: input.dateKey,
    headline,
    facts,
    footer: SOCIAL_STORY_FOOTER,
    caption: buildStoryText({
      slot: 'morning',
      dateKey: input.dateKey,
      headline,
      dataWindow,
    }),
    altText: buildSocialAltText({
      kind: 'story',
      slot: 'morning',
      dateKey: input.dateKey,
      headline,
      facts,
      dataWindow,
      cause: input.cause,
    }),
    kicker: `${framing.morningKicker} · ${dataWindow}`,
    accent,
    bars,
    barsLabel: bars.length > 0 ? 'Movimiento estimado por distrito' : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Tarde                                                                      */
/* -------------------------------------------------------------------------- */

export type SocialAfternoonAlert = {
  stationId: string;
  stationName: string;
  alertType: string;
  severity: number;
  metricValue: number;
  windowHours?: number;
};

export type SocialAfternoonEpisode = {
  stationId: string;
  stationName: string;
  kind: 'empty' | 'full';
  maxMinutes: number;
};

export type SocialAfternoonAnomaly = {
  weekday?: number;
  hour: number;
  value: number;
  baseline: number;
  deviationRatio: number;
  zScore?: number | null;
  direction: 'up' | 'down';
  isAnomaly: boolean;
};

export type SocialAfternoonStoryInput = {
  dateKey: string;
  network: SocialNetworkContext;
  alerts?: readonly SocialAfternoonAlert[];
  episodes?: readonly SocialAfternoonEpisode[];
  anomaly?: SocialAfternoonAnomaly | null;
  topDistricts?: readonly SocialDistrictStats[];
  cause?: SocialCause | null;
  /** Ventana real de datos; por defecto, 17:00–18:30. */
  dataWindow?: string;
};

function isWithinAlertWindow(alert: SocialAfternoonAlert): boolean {
  if (alert.windowHours === undefined) {
    return true;
  }

  return (
    Number.isFinite(alert.windowHours) &&
    alert.windowHours > 0 &&
    alert.windowHours <= ANALYTICS_WINDOWS.alertWindowHours
  );
}

function pickMostSevereAlert(
  alerts: readonly SocialAfternoonAlert[] | undefined
): SocialAfternoonAlert | null {
  const active = (alerts ?? []).filter(isWithinAlertWindow);
  if (active.length === 0) {
    return null;
  }

  return [...active].sort(
    (left, right) =>
      right.severity - left.severity ||
      left.metricValue - right.metricValue ||
      compareText(left.stationId, right.stationId)
  )[0]!;
}

function pickCriticalEpisode(
  episodes: readonly SocialAfternoonEpisode[] | undefined
): SocialAfternoonEpisode | null {
  const critical = (episodes ?? []).filter(
    (episode) => Number.isFinite(episode.maxMinutes) && episode.maxMinutes >= 180
  );
  if (critical.length === 0) {
    return null;
  }

  return [...critical].sort(
    (left, right) =>
      right.maxMinutes - left.maxMinutes || compareText(left.stationId, right.stationId)
  )[0]!;
}

function alertStory(
  alert: SocialAfternoonAlert,
  network: SocialNetworkContext,
  cause: SocialCause | null | undefined
): { headline: string; facts: SocialStoryFact[]; accent: string } {
  const isBikes = alert.alertType === 'LOW_BIKES';
  const issue = formatAvailabilityIssue(alert.alertType);
  const metricValue = Number.isInteger(alert.metricValue)
    ? formatInteger(alert.metricValue)
    : formatDecimal(alert.metricValue);
  const metricUnit = isBikes
    ? pluralize(alert.metricValue === 1 ? 1 : 2, 'bici', 'bicis')
    : pluralize(alert.metricValue === 1 ? 1 : 2, 'hueco', 'huecos');
  const metricLabel = `${metricValue} ${metricUnit}`;
  const headline = `${normalize(alert.stationName)}: ${issue.toLowerCase()}`;
  const facts = compactFacts([
    {
      label: 'Media en 3 h',
      value: metricLabel,
    },
    { label: 'Tipo', value: issue },
    networkFact(network),
    causeFact(cause),
  ]);

  return {
    headline,
    facts,
    accent: alert.severity >= 2 ? ACCENT_RED : ACCENT_AMBER,
  };
}

function episodeStory(
  episode: SocialAfternoonEpisode,
  network: SocialNetworkContext,
  cause: SocialCause | null | undefined
): { headline: string; facts: SocialStoryFact[]; accent: string } {
  const isBikes = episode.kind === 'empty';
  const minutes = formatInteger(episode.maxMinutes);
  // `maxMinutes` es la racha maxima de las ultimas 24 h, no necesariamente la
  // racha en curso. El filtro por estado actual garantiza que la estacion siga
  // sin bicis/huecos, pero el titular no debe prometer una continuidad exacta.
  const headline = isBikes
    ? `${normalize(episode.stationName)}: hasta ${minutes} min sin bicis en 24 h`
    : `${normalize(episode.stationName)}: hasta ${minutes} min sin huecos en 24 h`;
  const facts = compactFacts([
    { label: 'Racha máxima (24 h)', value: `${minutes} min` },
    { label: 'Tipo', value: isBikes ? 'Sin bicis' : 'Sin huecos' },
    networkFact(network),
    causeFact(cause),
  ]);

  return { headline, facts, accent: ACCENT_RED };
}

function anomalyStory(
  anomaly: SocialAfternoonAnomaly,
  network: SocialNetworkContext,
  cause: SocialCause | null | undefined
): { headline: string; facts: SocialStoryFact[]; accent: string } {
  const hour = String(Math.max(0, Math.min(23, Math.trunc(anomaly.hour)))).padStart(2, '0');
  const headline = `Posible pico de movimiento a las ${hour}:00`;
  const facts = compactFacts([
    { label: 'Índice de actividad', value: formatInteger(anomaly.value) },
    { label: 'Referencia', value: formatInteger(anomaly.baseline) },
    { label: 'Desviación', value: formatRatioDelta(anomaly.deviationRatio) },
    causeFact(cause),
    networkFact(network),
  ]);

  return { headline, facts, accent: ACCENT_AMBER };
}

function returnPulseStory(
  districts: readonly SocialDistrictStats[],
  network: SocialNetworkContext,
  weekend: boolean,
  cause: SocialCause | null | undefined
): { headline: string; facts: SocialStoryFact[]; accent: string } {
  const top = topDistrictsByActivity(districts, 2);

  if (top.length === 0) {
    const facts = compactFacts([networkFact(network), causeFact(cause)]);
    return {
      headline: weekend ? 'Cómo va el fin de semana en bici' : 'Así se mueve la red esta tarde',
      facts:
        facts.length > 0
          ? facts
          : [{ label: 'Datos', value: 'Sin datos suficientes para estimar movimiento' }],
      accent: ACCENT_SLATE,
    };
  }

  const headline = weekend
    ? `El fin de semana se mueve en ${normalize(top[0]!.district)}`
    : `Más movimiento estimado en ${normalize(top[0]!.district)}`;
  const facts = compactFacts([
    ...top.map<SocialStoryFact>((entry) => ({
      label: normalize(entry.district),
      value: `${formatInteger(entry.activityIndex)} puntos de actividad`,
    })),
    networkFact(network),
    causeFact(cause),
  ]).slice(0, 3);

  return { headline, facts, accent: ACCENT_TEAL };
}

/**
 * Story de las 18:30. Siempre devuelve una story. Prioridad del titular:
 *
 * 1. Alerta activa de 3 h, la mas severa.
 * 2. Racha critica de 180 min o mas.
 * 3. Anomalia horaria al alza ("posible pico", nunca causa confirmada).
 * 4. Pulso de vuelta: distritos con mas movimiento estimado.
 */
export function buildAfternoonStory(input: SocialAfternoonStoryInput): SocialStory {
  const framing = getDayFraming(input.dateKey);
  const dataWindow = input.dataWindow ?? SOCIAL_AFTERNOON_WINDOW;
  const cause = input.cause ?? null;
  const districts = input.topDistricts ?? [];
  const alert = pickMostSevereAlert(input.alerts);
  const episode = alert ? null : pickCriticalEpisode(input.episodes);
  const anomaly =
    !alert && !episode && input.anomaly?.isAnomaly && input.anomaly.direction === 'up'
      ? input.anomaly
      : null;

  const branch = alert
    ? alertStory(alert, input.network, cause)
    : episode
      ? episodeStory(episode, input.network, cause)
      : anomaly
        ? anomalyStory(anomaly, input.network, cause)
        : returnPulseStory(districts, input.network, framing.isWeekend, cause);

  const bars = districtBars(districts, 3);
  const facts = branch.facts;

  return {
    slot: 'afternoon',
    family: 'daily-story',
    dateKey: input.dateKey,
    headline: branch.headline,
    facts,
    footer: SOCIAL_STORY_FOOTER,
    caption: buildStoryText({
      slot: 'afternoon',
      dateKey: input.dateKey,
      headline: branch.headline,
      dataWindow,
    }),
    altText: buildSocialAltText({
      kind: 'story',
      slot: 'afternoon',
      dateKey: input.dateKey,
      headline: branch.headline,
      facts,
      dataWindow,
      cause,
    }),
    kicker: `${framing.afternoonKicker} · ${dataWindow}`,
    accent: branch.accent,
    bars: bars.length > 0 && (Boolean(anomaly) || (!alert && !episode)) ? bars : undefined,
    barsLabel: 'Movimiento estimado por distrito',
  };
}

/* -------------------------------------------------------------------------- */
/* Carrusel semanal                                                           */
/* -------------------------------------------------------------------------- */

export type SocialWeeklyCarouselInput = {
  week: SocialWeekRange;
  districts: readonly SocialDistrictStats[];
  network: SocialNetworkContext;
  cause?: SocialCause | null;
};

function slide(
  kicker: string,
  headline: string,
  facts: readonly SocialStoryFact[],
  accent: string,
  extra: Pick<SocialCarouselSlide, 'bars' | 'barsLabel'> = {}
): SocialCarouselSlide {
  return {
    kicker,
    headline,
    facts,
    footer: SOCIAL_FEED_FOOTER,
    accent,
    ...extra,
  };
}

/**
 * Carrusel semanal de 5 laminas: portada, top distritos, crecimiento, tension y
 * CTA. Devuelve `null` sin distritos, porque no hay historia que contar.
 */
export function buildWeeklyCarousel(input: SocialWeeklyCarouselInput): SocialCarousel | null {
  if (input.districts.length === 0) {
    return null;
  }

  const weekLabel = formatSocialWeekLabel(input.week.weekStart, input.week.weekEnd);
  const top = topDistrictsByActivity(input.districts, 3);
  const growth = topDistrictsByGrowth(input.districts, 1)[0] ?? null;
  const friction = topDistrictsByFriction(input.districts, 1)[0] ?? null;
  const coverHeadline = `Zaragoza en bici · ${weekLabel}`;
  const bars = districtBars(input.districts, 5);
  const network = networkFact(input.network);

  const coverFacts = compactFacts([
    network,
    { label: 'Distritos con datos', value: formatInteger(input.districts.length) },
  ]).slice(0, 3);

  const topFacts: SocialStoryFact[] = top.map((entry, index) => ({
    label: `${index + 1}. ${normalize(entry.district)}`,
    value: `${formatInteger(entry.activityIndex)} puntos de actividad`,
  }));

  const growthFacts: SocialStoryFact[] = growth
    ? compactFacts([
        {
          label: 'Cambio semanal',
          value: formatGrowthFact(growth.growthRatio),
        },
        {
          label: 'Semana actual',
          value: `${formatInteger(growth.activityIndex)} puntos`,
        },
        {
          label: 'Semana anterior',
          value: `${formatInteger(growth.previousActivityIndex)} puntos`,
        },
      ])
    : [{ label: 'Comparación', value: 'Sin semana anterior comparable' }];

  const frictionFacts: SocialStoryFact[] = friction
    ? [
        {
          label: 'Tasa de tensión',
          value: formatPercent(friction.frictionRate),
        },
        {
          label: 'Horas con tensión',
          value: `${formatInteger(friction.emptyHours + friction.fullHours)} de ${formatInteger(friction.totalHours)} h`,
        },
        {
          label: 'Estaciones',
          value: formatInteger(friction.stationCount),
        },
      ]
    : [{ label: 'Tensión', value: 'Sin horas críticas registradas' }];

  const growthHeadline = growth
    ? (growth.growthRatio ?? 0) >= 0
      ? `${normalize(growth.district)} sube un ${formatGrowthMagnitude(growth.growthRatio ?? 0)}`
      : `${normalize(growth.district)} baja un ${formatGrowthMagnitude(growth.growthRatio ?? 0)}`
    : 'Sin comparación con la semana anterior';

  const slides: SocialCarouselSlide[] = [
    slide(
      'La semana en bici',
      coverHeadline,
      coverFacts,
      ACCENT_TEAL,
      { bars, barsLabel: 'Movimiento estimado por distrito' }
    ),
    slide(
      'Actividad por distrito',
      top.length > 0 ? 'Los distritos con más movimiento' : 'Sin distritos con actividad',
      topFacts.length > 0 ? topFacts : [{ label: 'Distritos', value: 'Sin actividad registrada' }],
      ACCENT_BLUE,
      {
        bars: top.map((entry) => ({
          label: normalize(entry.district),
          value: entry.activityIndex,
        })),
        barsLabel: 'Índice de actividad',
      }
    ),
    slide('Cambio semanal', growthHeadline, growthFacts, ACCENT_TEAL, {
      bars: growth
        ? [
            { label: 'Esta semana', value: growth.activityIndex },
            { label: 'Semana anterior', value: growth.previousActivityIndex },
          ]
        : undefined,
      barsLabel: 'Índice de actividad',
    }),
    slide(
      'Tensión en la red',
      friction
        ? `${normalize(friction.district)} concentra la tensión`
        : 'Sin horas críticas registradas',
      frictionFacts,
      ACCENT_AMBER
    ),
    slide(
      'Explora los datos',
      'Explora tu barrio en datosbizi.com',
      [
        { label: 'Semana', value: weekLabel },
        { label: 'Web', value: 'datosbizi.com' },
        { label: 'Qué encontrarás', value: 'Índice de actividad, movimiento estimado y tensión por distrito' },
      ],
      ACCENT_TEAL
    ),
  ];

  const captionFacts = compactFacts([
    top[0]
      ? {
          label: 'Distrito con más movimiento',
          value: normalize(top[0].district),
        }
      : null,
    growth
      ? {
          label: 'Mayor cambio',
          value: `${normalize(growth.district)} · ${formatGrowthFact(growth.growthRatio)}`,
        }
      : null,
    friction
      ? {
          label: 'Más tensión',
          value: `${normalize(friction.district)} · ${formatPercent(friction.frictionRate)}`,
        }
      : null,
  ]);

  return {
    slot: 'weekly',
    family: 'weekly-carousel',
    dateKey: input.week.weekStart,
    headline: coverHeadline,
    facts: coverFacts,
    footer: SOCIAL_FEED_FOOTER,
    caption: buildFeedCaption({
      hook: `Zaragoza en bici · ${weekLabel}`,
      facts: captionFacts,
      context: input.network.label ? `Red: ${normalize(input.network.label)}.` : null,
      cta: SOCIAL_FEED_CTA,
    }),
    altText: buildSocialAltText({
      kind: 'carousel',
      slot: 'weekly',
      dateKey: input.week.weekStart,
      headline: coverHeadline,
      slides,
      cause: input.cause,
    }),
    slides,
  };
}

/* -------------------------------------------------------------------------- */
/* Carrusel mensual                                                           */
/* -------------------------------------------------------------------------- */

export type SocialMonthlyCarouselInput = {
  report: MonthlyReport;
  /** Ruta publica del informe; por defecto `datosbizi.com/informes/{monthKey}`. */
  reportPath?: string;
};

const TREND_LABEL: Record<ReportTrend, string> = {
  mejora: 'Mejora',
  empeora: 'Empeora',
  estable: 'Estable',
  'sin-datos': 'Sin comparación',
};

function trendHeadline(trend: ReportTrend): string {
  switch (trend) {
    case 'mejora':
      return 'La actividad mejora frente al mes anterior';
    case 'empeora':
      return 'La actividad baja frente al mes anterior';
    case 'estable':
      return 'La actividad se mantiene';
    default:
      return 'Sin comparación mensual';
  }
}

/**
 * Carrusel mensual de 5 laminas a partir del `MonthlyReport` ya construido. No
 * recalcula el informe; solo lee campos existentes. Devuelve `null` si el
 * informe no esta disponible o no cubre ningun dia.
 */
export function buildMonthlyCarousel(input: SocialMonthlyCarouselInput): SocialCarousel | null {
  const { report } = input;
  const expectedDays = report.coverage?.expectedDays ?? 0;
  const coveredDays = report.coverage?.coveredDays ?? report.headline?.coveredDays ?? 0;

  // El slot mensual publica un mes cerrado; un informe parcial (por ejemplo,
  // con el rollup a medias) no debe convertirse en una infografia de autoridad.
  if (
    !report.hasReport ||
    !report.coverage?.isComplete ||
    coveredDays <= 0 ||
    expectedDays <= 0
  ) {
    return null;
  }

  const monthLabel = formatMonthLabel(report.monthKey);
  const headline = report.headline;
  const mostActive = report.districts?.mostActive?.[0] ?? null;
  const topStation = report.topStations?.[0] ?? null;
  const worstFriction = report.problemSpots?.worstFriction?.[0] ?? null;
  const monthPath = input.reportPath ?? `/informes/${report.monthKey}`;
  const publicUrl = `datosbizi.com${monthPath.startsWith('/') ? monthPath : `/${monthPath}`}`;
  const coverHeadline = `Zaragoza en bici · ${monthLabel}`;

  const trendBars: SocialBar[] = (report.trends?.monthly ?? [])
    .slice(-6)
    .map((entry) => ({
      label: formatMonthName(entry.monthKey),
      value: entry.demandScore,
    }))
    .filter((bar) => Number.isFinite(bar.value) && bar.value > 0);

  const keyFacts: SocialStoryFact[] = [
    {
      label: 'Índice de actividad',
      value: `${formatInteger(headline.demandScore)} ${activityIndexUnits.perMonth}`,
    },
    { label: 'Ocupación media', value: formatPercent(headline.avgOccupancy) },
    { label: 'Estaciones activas', value: formatInteger(headline.activeStations) },
    {
      label: 'Días con datos',
      value: `${formatInteger(coveredDays)} de ${formatInteger(expectedDays)}`,
    },
  ];

  const trendFacts: SocialStoryFact[] = compactFacts([
    {
      label: 'Comparación',
      value: report.comparison?.isComparable
        ? `${TREND_LABEL[report.comparison.trend]} · ${formatGrowthFact(report.comparison.normalizedDemandRatio)}`
        : report.comparison?.reason || 'Sin comparación mensual',
    },
    {
      label: 'Estacionalidad',
      value: report.seasonality?.label || 'Sin serie histórica suficiente',
    },
    {
      label: 'Periodo',
      value: report.comparison?.periodLabel || monthLabel,
    },
  ]);

  const districtFacts: SocialStoryFact[] = compactFacts([
    mostActive
      ? {
          label: 'Distrito más activo',
          value: `${normalize(mostActive.district)} · ${formatInteger(mostActive.demandScore)} puntos`,
        }
      : null,
    topStation
      ? {
          label: 'Estación con más actividad',
          value: `${normalize(topStation.stationName)} · ${formatDecimal(topStation.avgDemand)} puntos/día`,
        }
      : null,
    worstFriction
      ? {
          label: 'Más tensión',
          value: `${normalize(worstFriction.stationName)} · ${formatPercent(worstFriction.frictionRate)}`,
        }
      : null,
  ]);

  const slides: SocialCarouselSlide[] = [
    slide(
      'Informe mensual',
      coverHeadline,
      compactFacts([
        { label: 'Balance', value: normalize(report.balance.headline) },
        {
          label: 'Cobertura',
          value: `${formatInteger(coveredDays)} de ${formatInteger(expectedDays)} días`,
        },
      ]),
      ACCENT_BLUE,
      { bars: trendBars, barsLabel: 'Actividad mensual' }
    ),
    slide('Las cifras del mes', 'La actividad en cifras', keyFacts, ACCENT_TEAL),
    slide(
      'Tendencia',
      trendHeadline(report.comparison?.trend ?? 'sin-datos'),
      trendFacts,
      report.comparison?.trend === 'mejora'
        ? ACCENT_TEAL
        : report.comparison?.trend === 'empeora'
          ? ACCENT_AMBER
          : ACCENT_BLUE,
      { bars: trendBars, barsLabel: 'Actividad mensual' }
    ),
    slide(
      'Distritos y récords',
      mostActive ? `${normalize(mostActive.district)} lidera la actividad` : 'Récords del mes',
      districtFacts.length > 0
        ? districtFacts
        : [{ label: 'Distritos', value: 'Sin distritos destacados este mes' }],
      ACCENT_TEAL
    ),
    slide(
      'Informe completo',
      'Lee el informe completo',
      [
        { label: 'Informe', value: publicUrl },
        { label: 'Mes', value: formatSocialMonthLabel(report.monthKey) },
      ],
      ACCENT_TEAL
    ),
  ];

  const captionFacts: SocialStoryFact[] = [
    {
      label: 'Índice de actividad',
      value: `${formatInteger(headline.demandScore)} ${activityIndexUnits.perMonth}`,
    },
    { label: 'Ocupación media', value: formatPercent(headline.avgOccupancy) },
    {
      label: 'Estaciones activas',
      value: `${formatInteger(headline.activeStations)} · ${formatInteger(coveredDays)} de ${formatInteger(expectedDays)} días`,
    },
  ];

  return {
    slot: 'monthly',
    family: 'monthly-carousel',
    dateKey: report.monthKey,
    headline: coverHeadline,
    facts: slides[0]!.facts,
    footer: SOCIAL_FEED_FOOTER,
    caption: buildFeedCaption({
      hook: `Zaragoza en bici · ${monthLabel}`,
      facts: captionFacts,
      context: [normalize(report.balance.headline), normalize(report.balance.detail)]
        .filter(Boolean)
        .join(' '),
      cta: `Lee el informe completo en ${publicUrl}`,
    }),
    altText: buildSocialAltText({
      kind: 'carousel',
      slot: 'monthly',
      dateKey: `${report.monthKey}-01`,
      headline: coverHeadline,
      slides,
    }),
    slides,
  };
}
