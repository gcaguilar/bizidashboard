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
  activityPerStation,
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
  SocialDroppingStation,
  SocialEveningStationProfile,
  SocialMorningStationProfile,
  SocialNearbyAlternative,
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

const BARS_LABEL = 'Puntos de actividad por estación';

function normalize(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

  return {
    label: 'En toda la red',
    value:
      critical === 0
        ? 'Ninguna estación sin bicis ni sin huecos'
        : `${formatInteger(critical)} de ${formatInteger(network.totalStations)} estaciones sin bicis o sin huecos`,
  };
}

function causeFact(cause?: SocialCause | null): SocialStoryFact | null {
  return cause?.label ? { label: 'Contexto', value: normalize(cause.label) } : null;
}

function districtBars(
  districts: readonly SocialDistrictStats[],
  limit = 3,
  preferred?: (entry: SocialDistrictStats) => number
): SocialBar[] {
  return topDistrictsByActivity(districts, limit)
    .map((entry) => ({
      label: normalize(entry.district),
      value: preferred ? preferred(entry) : Math.round(activityPerStation(entry)),
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
  /** Perfil historico (entre semana, 7–9 h) para decir con que frecuencia se vacian. */
  profiles?: readonly SocialMorningStationProfile[];
  /** Estacion cercana con bicis para quien encuentra la suya vacia. */
  alternative?: SocialNearbyAlternative | null;
  /** Estaciones que pierden bicis deprisa (hecho observado, no prediccion). */
  dropping?: readonly SocialDroppingStation[];
  network: SocialNetworkContext;
  cause?: SocialCause | null;
  /** Hora real de la foto de datos; por defecto, 08:30. */
  dataWindow?: string;
};

/** Muestras (horas) minimas para afirmar una frecuencia historica. */
const MIN_PROFILE_SAMPLES = 20;
/** Por debajo de este porcentaje no merece la pena decir "suele vaciarse". */
const MIN_HABITUAL_SHARE = 0.1;

function anchorsLabel(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
  return `${formatInteger(safe)} ${pluralize(safe, 'hueco', 'huecos')}`;
}

function alternativeFact(
  selection: SocialStationSelection<SocialStationCandidate>,
  alternative: SocialNearbyAlternative | null | undefined
): SocialStoryFact | null {
  if (!alternative) {
    return null;
  }

  const origin = selection.stations.find((station) => station.id === alternative.fromStationId);
  if (!origin) {
    return null;
  }

  const isBikes = alternative.kind === 'bikes';
  const available = isBikes
    ? bikesLabel(alternative.available)
    : anchorsLabel(alternative.available);

  return {
    label: isBikes ? 'Dónde coger bici cerca' : 'Dónde dejar la bici cerca',
    value: `Desde ${normalize(origin.name)}: ${normalize(alternative.name)}, a unos ${formatInteger(alternative.distanceMeters)} m (${available})`,
  };
}

/** Aviso de día especial: "Hoy: Fiestas del Pilar". Solo con causa curada. */
function todayFact(cause?: SocialCause | null): SocialStoryFact | null {
  return cause?.label ? { label: 'Hoy', value: normalize(cause.label) } : null;
}

function habitualFact(
  selection: SocialStationSelection<SocialStationCandidate>,
  profiles: readonly SocialMorningStationProfile[] | undefined
): SocialStoryFact | null {
  const profileById = new Map((profiles ?? []).map((profile) => [profile.stationId, profile]));

  for (const station of selection.stations) {
    const profile = profileById.get(station.id);
    if (
      !profile ||
      !(profile.emptyShare >= MIN_HABITUAL_SHARE) ||
      (profile.sampleCount !== undefined && profile.sampleCount < MIN_PROFILE_SAMPLES)
    ) {
      continue;
    }

    return {
      label: 'Lo habitual, de lunes a viernes de 7 a 9 h',
      value: `${normalize(station.name)}: sin bicis el ${formatPercent(profile.emptyShare)} del tiempo`,
    };
  }

  return null;
}

function droppingFact(dropping: readonly SocialDroppingStation[] | undefined): SocialStoryFact | null {
  const items = (dropping ?? []).slice(0, 3);
  if (items.length === 0) {
    return null;
  }

  // Siempre en pasado y con la ventana real: la story se lee horas despues.
  return {
    label: 'Bajando rápido',
    value: items
      .map(
        (entry) =>
          `${normalize(entry.name)}: de ${formatInteger(entry.bikesBefore)} a ${bikesLabel(entry.bikesNow)} en ${formatInteger(entry.minutes)} min`
      )
      .join(' · '),
  };
}

function morningStationFact(selection: SocialStationSelection<SocialStationCandidate>): SocialStoryFact {
  // Buenas noticias concretas: las habituales, con las bicis que tienen ahora.
  if (selection.mode === 'none' && selection.stations.length > 0) {
    return {
      label: 'Estaciones que suelen vaciarse',
      value: selection.stations
        .slice(0, 3)
        .map((station) => `${normalize(station.name)} (${bikesLabel(station.bikesAvailable)})`)
        .join(' · '),
    };
  }

  if (selection.stations.length === 0) {
    return {
      label: 'Estaciones que suelen vaciarse',
      value:
        selection.mode === 'none' ? 'Todas con bicis' : 'Sin estaciones para destacar',
    };
  }

  // Sin bicis, "(0 bicis)" repite el titular: solo se cuentan cuando hay alguna.
  const stations = selection.stations.slice(0, 3).map((station) => {
    const name = normalize(station.name);
    return selection.mode === 'empty'
      ? name
      : `${name} (${bikesLabel(station.bikesAvailable)})`;
  });

  return {
    label:
      selection.mode === 'empty'
        ? 'Estaciones sin bicis'
        : selection.mode === 'low'
          ? 'Estaciones con pocas bicis'
          : 'Estaciones que suelen vaciarse',
    value: stations.join(' · '),
  };
}

function morningHeadline(selection: SocialStationSelection<SocialStationCandidate>): string {
  const count = selection.stations.length;

  // "Que suelen vaciarse" es la cohorte historica del agente: sin ese matiz el
  // titular pareceria un recuento de toda la red.
  const usual = `${pluralize(count, 'estación que suele', 'estaciones que suelen')} vaciarse`;

  if (selection.mode === 'empty' && count > 0) {
    return `${formatInteger(count)} ${usual}, sin bicis`;
  }

  if (selection.mode === 'low' && count > 0) {
    return `${formatInteger(count)} ${usual}, con pocas bicis`;
  }

  return 'Hay bicis en las estaciones que suelen vaciarse';
}

/**
 * Story de las 08:30. Un solo mensaje: hay bicis o no en las estaciones que
 * suelen vaciarse. Titular segun el modo de seleccion (sin bicis, pocas bicis
 * o ninguna), una alternativa cercana con bicis, el aviso de dia especial si
 * lo hay, las estaciones que bajan deprisa, cuanto suele pasar y contexto de red (lo ultimo: el render solo
 * pinta 4 hechos, asi que en un dia especial la red es lo que se cae). Sin distritos ni barras:
 * a esa hora nadie busca un ranking. Devuelve `null` si no hay ni estaciones
 * ni red.
 */
export function buildMorningStory(input: SocialMorningStoryInput): SocialStory | null {
  const stations = input.selection.stations ?? [];
  const network = input.network;

  if (stations.length === 0 && network.totalStations <= 0) {
    return null;
  }

  const framing = getDayFraming(input.dateKey);
  const dataWindow = input.dataWindow ?? SOCIAL_MORNING_WINDOW;
  const facts = compactFacts([
    morningStationFact(input.selection),
    alternativeFact(input.selection, input.alternative),
    todayFact(input.cause),
    droppingFact(input.dropping),
    habitualFact(input.selection, input.profiles),
    networkFact(network),
  ]);

  const headline = morningHeadline(input.selection);
  const accent =
    input.selection.mode === 'empty'
      ? ACCENT_RED
      : input.selection.mode === 'low'
        ? ACCENT_AMBER
        : ACCENT_TEAL;

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
  /** Estaciones que suelen llenarse y ahora estan sin huecos o casi ("donde dejar la bici"). */
  fullStations?: SocialStationSelection<SocialStationCandidate> | null;
  /** Perfil historico (entre semana, 17–19 h) para decir con que frecuencia se llenan. */
  eveningProfiles?: readonly SocialEveningStationProfile[];
  /** Estacion cercana con huecos para quien encuentra la suya llena. */
  alternative?: SocialNearbyAlternative | null;
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
      label: 'Media de las últimas 3 h',
      value: metricLabel,
    },
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
    { label: 'Peor racha en 24 h', value: `${minutes} min` },
    networkFact(network),
    causeFact(cause),
  ]);

  return { headline, facts, accent: ACCENT_RED };
}

function anomalyStory(
  anomaly: SocialAfternoonAnomaly,
  cause: SocialCause | null | undefined
): { headline: string; facts: SocialStoryFact[]; accent: string } {
  const hour = String(Math.max(0, Math.min(23, Math.trunc(anomaly.hour)))).padStart(2, '0');
  const headline = `Posible pico de uso a las ${hour}:00`;
  const facts = compactFacts([
    { label: 'Uso frente a lo habitual a esa hora', value: formatRatioDelta(anomaly.deviationRatio) },
    causeFact(cause),
  ]);

  return { headline, facts, accent: ACCENT_AMBER };
}

function eveningHabitualFact(
  selection: SocialStationSelection<SocialStationCandidate>,
  profiles: readonly SocialEveningStationProfile[] | undefined
): SocialStoryFact | null {
  const profileById = new Map((profiles ?? []).map((profile) => [profile.stationId, profile]));

  for (const station of selection.stations) {
    const profile = profileById.get(station.id);
    if (
      !profile ||
      !(profile.fullShare >= MIN_HABITUAL_SHARE) ||
      (profile.sampleCount !== undefined && profile.sampleCount < MIN_PROFILE_SAMPLES)
    ) {
      continue;
    }

    return {
      label: 'Lo habitual, de lunes a viernes de 17 a 19 h',
      value: `${normalize(station.name)}: sin huecos el ${formatPercent(profile.fullShare)} del tiempo`,
    };
  }

  return null;
}

/**
 * "Donde dejar la bici": espejo de la story de la manana. Un solo mensaje, con
 * una estacion cercana con huecos como salida.
 */
function fullStationsStory(
  selection: SocialStationSelection<SocialStationCandidate>,
  alternative: SocialNearbyAlternative | null | undefined,
  profiles: readonly SocialEveningStationProfile[] | undefined,
  network: SocialNetworkContext,
  cause: SocialCause | null | undefined
): { headline: string; facts: SocialStoryFact[]; accent: string } {
  const count = selection.stations.length;
  const usual = `${pluralize(count, 'estación que suele', 'estaciones que suelen')} llenarse`;
  const isFull = selection.mode === 'full';
  const names = selection.stations.slice(0, 3).map((station) => {
    const name = normalize(station.name);
    return isFull ? name : `${name} (${anchorsLabel(station.anchorsFree)})`;
  });

  return {
    headline: `${formatInteger(count)} ${usual}, ${isFull ? 'sin huecos' : 'con pocos huecos'}`,
    facts: compactFacts([
      {
        label: isFull ? 'Estaciones sin huecos' : 'Estaciones con pocos huecos',
        value: names.join(' · '),
      },
      alternativeFact(selection, alternative),
      todayFact(cause),
      eveningHabitualFact(selection, profiles),
      networkFact(network),
    ]),
    accent: isFull ? ACCENT_RED : ACCENT_AMBER,
  };
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
      headline: weekend ? 'Cómo va la Bizi este fin de semana' : 'Cómo va la Bizi esta tarde',
      facts:
        facts.length > 0
          ? facts
          : [{ label: 'Datos', value: 'Sin datos suficientes para estimar el uso' }],
      accent: ACCENT_SLATE,
    };
  }

  const headline = weekend
    ? `Fin de semana: más uso en ${normalize(top[0]!.district)}`
    : `Más uso de la Bizi en ${normalize(top[0]!.district)}`;
  const rankLabels = ['Más uso', 'Segundo', 'Tercero'];
  const facts = compactFacts([
    ...top.map<SocialStoryFact>((entry, index) => ({
      label: rankLabels[index] ?? `${index + 1}.º`,
      value: normalize(entry.district),
    })),
    causeFact(cause),
  ]).slice(0, 3);

  return { headline, facts, accent: ACCENT_TEAL };
}

/**
 * Story de las 18:30. Siempre devuelve una story. Prioridad del titular:
 *
 * 1. Alerta activa de 3 h, la mas severa.
 * 2. Racha critica de 180 min o mas.
 * 3. Donde dejar la bici: estaciones que suelen llenarse y estan sin huecos.
 * 4. Anomalia horaria al alza, solo si hay causa curada ("posible pico").
 * 5. Pulso de vuelta: distritos con mas uso estimado.
 */
export function buildAfternoonStory(input: SocialAfternoonStoryInput): SocialStory {
  const framing = getDayFraming(input.dateKey);
  const dataWindow = input.dataWindow ?? SOCIAL_AFTERNOON_WINDOW;
  const cause = input.cause ?? null;
  const districts = input.topDistricts ?? [];
  const alert = pickMostSevereAlert(input.alerts);
  const episode = alert ? null : pickCriticalEpisode(input.episodes);
  const fullStations =
    !alert && !episode && input.fullStations && input.fullStations.stations.length > 0
      ? input.fullStations
      : null;
  // Un pico sin causa conocida no dice nada al lector ("+66%" ¿de qué?): solo
  // se cuenta cuando el llamante aporta una causa curada (fiestas, evento...).
  const anomaly =
    !alert && !episode && !fullStations && cause && input.anomaly?.isAnomaly && input.anomaly.direction === 'up'
      ? input.anomaly
      : null;

  const branch = alert
    ? alertStory(alert, input.network, cause)
    : episode
      ? episodeStory(episode, input.network, cause)
      : fullStations
        ? fullStationsStory(
            fullStations,
            input.alternative,
            input.eveningProfiles,
            input.network,
            cause
          )
        : anomaly
        ? anomalyStory(anomaly, cause)
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
    bars:
      bars.length > 0 && (Boolean(anomaly) || (!alert && !episode && !fullStations))
        ? bars
        : undefined,
    barsLabel: BARS_LABEL,
  };
}

/* -------------------------------------------------------------------------- */
/* Carrusel semanal                                                           */
/* -------------------------------------------------------------------------- */

export type SocialWeeklyCarouselInput = {
  week: SocialWeekRange;
  districts: readonly SocialDistrictStats[];
  /** Ya no se pinta: una foto de red de un lunes no resume la semana. */
  network?: SocialNetworkContext;
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
  // Titular con conclusion; la semana va en el kicker y en el gancho del caption.
  const coverHeadline = top[0]
    ? `${normalize(top[0].district)}: donde más se usa la Bizi`
    : 'La Bizi esta semana';
  const bars = districtBars(input.districts, 5);

  // La portada explica el criterio: sin esto, un ranking por estación se leería
  // como un ranking por tamaño del distrito.
  const coverFacts: SocialStoryFact[] = [
    { label: 'Cómo se mide', value: 'Uso medio de cada estación del distrito' },
  ];

  const topFacts: SocialStoryFact[] = top.map((entry, index) => ({
    label: `${index + 1}. ${normalize(entry.district)}`,
    value: `${formatInteger(activityPerStation(entry))} puntos por estación`,
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
          label: 'Horas sin bicis o sin huecos',
          value: `${formatInteger(friction.emptyHours + friction.fullHours)} de ${formatInteger(friction.totalHours)} h · ${formatPercent(friction.frictionRate)}`,
        },
        {
          label: 'Estaciones del distrito',
          value: formatInteger(friction.stationCount),
        },
      ]
    : [{ label: 'Disponibilidad', value: 'Sin horas con estaciones vacías o llenas' }];

  const growthHeadline = growth
    ? (growth.growthRatio ?? 0) >= 0
      ? `El uso en ${normalize(growth.district)} sube un ${formatGrowthMagnitude(growth.growthRatio ?? 0)}`
      : `El uso en ${normalize(growth.district)} baja un ${formatGrowthMagnitude(growth.growthRatio ?? 0)}`
    : 'Sin comparación con la semana anterior';

  const slides: SocialCarouselSlide[] = [
    slide(
      capitalize(weekLabel),
      coverHeadline,
      coverFacts,
      ACCENT_TEAL,
      { bars, barsLabel: BARS_LABEL }
    ),
    slide(
      'Uso por distrito',
      top.length > 0 ? 'Dónde más se usó la Bizi' : 'Sin distritos con actividad',
      topFacts.length > 0 ? topFacts : [{ label: 'Distritos', value: 'Sin actividad registrada' }],
      ACCENT_BLUE,
      {
        bars: districtBars(input.districts, 3),
        barsLabel: BARS_LABEL,
      }
    ),
    slide('Cambio semanal', growthHeadline, growthFacts, ACCENT_TEAL, {
      bars: growth
        ? [
            { label: 'Esta semana', value: growth.activityIndex },
            { label: 'Semana anterior', value: growth.previousActivityIndex },
          ]
        : undefined,
      barsLabel: 'Puntos de actividad',
    }),
    slide(
      'Sin bicis o sin huecos',
      friction
        ? `${normalize(friction.district)}: más horas sin bicis o huecos`
        : 'Sin horas críticas registradas',
      frictionFacts,
      ACCENT_AMBER
    ),
    slide(
      'Explora los datos',
      'Explora tu barrio en datosbizi.com',
      [
        {
          label: 'Qué son los puntos de actividad',
          value: 'Miden cuánto cambian las bicis y los huecos en cada estación',
        },
        { label: 'Web', value: 'datosbizi.com' },
      ],
      ACCENT_TEAL
    ),
  ];

  const captionFacts = compactFacts([
    top[0]
      ? {
          label: 'Distrito con más uso',
          value: normalize(top[0].district),
        }
      : null,
    growth
      ? {
          label: 'Mayor cambio de uso',
          value: `${normalize(growth.district)} · ${formatGrowthFact(growth.growthRatio)}`,
        }
      : null,
    friction
      ? {
          label: 'Más horas sin bicis o sin huecos',
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
      hook: `${coverHeadline} · ${weekLabel}`,
      facts: captionFacts,
      context: 'Comparamos el uso medio de cada estación para que los distritos grandes no ganen solo por tener más.',
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

function monthlyPeakHourFact(hour: number | null | undefined): SocialStoryFact | null {
  if (hour === null || hour === undefined || !Number.isFinite(hour)) {
    return null;
  }

  const start = Math.max(0, Math.min(23, Math.trunc(hour)));
  return {
    label: 'Hora con más uso',
    value: `${String(start).padStart(2, '0')}:00–${String((start + 1) % 24).padStart(2, '0')}:00`,
  };
}

/** "Entre semana se usa un 67% más por día": solo con dias de ambos tipos. */
function weekdayWeekendFact(
  profile: MonthlyReport['weekdayWeekendProfile'] | undefined
): SocialStoryFact | null {
  const weekday = profile?.weekday;
  const weekend = profile?.weekend;
  if (
    !weekday ||
    !weekend ||
    weekday.daysCount <= 0 ||
    weekend.daysCount <= 0 ||
    weekday.avgDemand <= 0 ||
    weekend.avgDemand <= 0
  ) {
    return null;
  }

  const ratio = weekday.avgDemand / weekend.avgDemand - 1;
  if (Math.round(Math.abs(ratio) * 100) === 0) {
    return { label: 'Entre semana y fin de semana', value: 'Se usa igual cada día' };
  }

  return {
    label: 'Entre semana y fin de semana',
    value:
      ratio > 0
        ? `Entre semana se usa un ${formatGrowthMagnitude(ratio)} más por día`
        : `En fin de semana se usa un ${formatGrowthMagnitude(weekend.avgDemand / weekday.avgDemand - 1)} más por día`,
  };
}

function trendHeadline(trend: ReportTrend): string {
  switch (trend) {
    case 'mejora':
      return 'Más uso que el mes anterior';
    case 'empeora':
      return 'Menos uso que el mes anterior';
    case 'estable':
      return 'Uso estable frente al mes anterior';
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
  const coverHeadline = `La Bizi en ${monthLabel}`;

  // La lamina pinta 5 barras: las 5 ultimas, para que el mes del informe (el
  // ultimo) nunca quede fuera.
  const trendBars: SocialBar[] = (report.trends?.monthly ?? [])
    .slice(-5)
    .map((entry) => ({
      label: formatMonthName(entry.monthKey),
      value: entry.demandScore,
    }))
    .filter((bar) => Number.isFinite(bar.value) && bar.value > 0);

  const peakHour = monthlyPeakHourFact(headline.peakHour);
  const weekendGap = weekdayWeekendFact(report.weekdayWeekendProfile);

  // Solo cifras que el lector entiende sin glosario: cuanto se uso, cuando y
  // cuando mas. Ocupacion media, estaciones activas y dias con datos se quedan
  // en el informe completo.
  const keyFacts: SocialStoryFact[] = compactFacts([
    {
      label: 'Uso estimado',
      value: `${formatInteger(headline.demandScore)} ${activityIndexUnits.perMonth}`,
    },
    peakHour,
    weekendGap,
  ]);

  const seasonalRatio =
    report.seasonality?.ratioVsPreviousYears ?? report.seasonality?.ratioVsSeries ?? null;
  const seasonalLabel =
    report.seasonality?.ratioVsPreviousYears != null
      ? `Frente a ${formatMonthName(report.monthKey)} de otros años`
      : 'Frente a la media histórica';

  const trendFacts: SocialStoryFact[] = compactFacts([
    report.comparison?.isComparable
      ? {
          label: `Frente a ${report.comparison.periodLabel || 'el mes anterior'}`,
          value: formatGrowthFact(report.comparison.normalizedDemandRatio),
        }
      : { label: 'Comparación', value: report.comparison?.reason || 'Sin comparación mensual' },
    seasonalRatio !== null ? { label: seasonalLabel, value: formatGrowthFact(seasonalRatio) } : null,
  ]);

  const districtFacts: SocialStoryFact[] = compactFacts([
    mostActive
      ? {
          label: 'Distrito con más uso',
          value: `${normalize(mostActive.district)} · ${formatInteger(mostActive.demandScore)} puntos`,
        }
      : null,
    topStation
      ? {
          label: 'Estación más usada',
          value: `${normalize(topStation.stationName)} · ${formatDecimal(topStation.avgDemand)} ${activityIndexUnits.perDay}`,
        }
      : null,
    worstFriction
      ? {
          label: 'Más horas sin bicis o sin huecos',
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
      ]),
      ACCENT_BLUE,
      { bars: trendBars, barsLabel: 'Puntos de actividad al mes' }
    ),
    slide('Las cifras del mes', 'El mes en cifras', keyFacts, ACCENT_TEAL),
    slide(
      'Tendencia',
      trendHeadline(report.comparison?.trend ?? 'sin-datos'),
      trendFacts,
      report.comparison?.trend === 'mejora'
        ? ACCENT_TEAL
        : report.comparison?.trend === 'empeora'
          ? ACCENT_AMBER
          : ACCENT_BLUE,
      { bars: trendBars, barsLabel: 'Puntos de actividad al mes' }
    ),
    slide(
      'Distritos y estaciones',
      mostActive ? `${normalize(mostActive.district)} es el distrito con más uso` : 'Récords del mes',
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

  const captionFacts: SocialStoryFact[] = compactFacts([keyFacts[0] ?? null, peakHour, weekendGap]);

  return {
    slot: 'monthly',
    family: 'monthly-carousel',
    dateKey: report.monthKey,
    headline: coverHeadline,
    facts: slides[0]!.facts,
    footer: SOCIAL_FEED_FOOTER,
    caption: buildFeedCaption({
      hook: report.comparison?.isComparable
        ? `${coverHeadline}: ${trendHeadline(report.comparison.trend).toLowerCase()}`
        : coverHeadline,
      facts: captionFacts,
      // Solo el titular del balance: ya lleva la cifra ("El uso creció un 12%…") y
      // el detalle repite "índice de actividad", jerga que no queremos en el feed.
      context: normalize(report.balance.headline),
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
