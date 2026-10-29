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
  buildSocialCta,
  buildStoryText,
  formatAvailabilityIssue,
  formatGrowthFact,
  formatGrowthMagnitude,
  formatSocialMonthLabel,
  formatSocialWeekLabel,
  getDayFraming,
  pluralize,
  SOCIAL_AFTERNOON_WINDOW,
  SOCIAL_FEATURE_WINDOW,
  SOCIAL_FEED_FOOTER,
  SOCIAL_MIDDAY_WINDOW,
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
  SocialContentMetadata,
  SocialDistrictDemandRow,
  SocialDistrictFrictionRow,
  SocialDistrictStats,
  SocialDroppingStation,
  SocialEveningStationProfile,
  SocialFeatureTheme,
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

function uniqueStrings(values: readonly string[]): string[] {
  const unique: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (normalized && !unique.includes(normalized)) {
      unique.push(normalized);
    }
  }
  return unique;
}

/** Metadata solo con lo que la pieza ensena; nunca IDs inventados. */
function contentMetadata(input: {
  theme?: string;
  stationIds?: readonly string[];
  districtNames?: readonly string[];
  spotlightDistrict?: string | null;
}): SocialContentMetadata | undefined {
  const theme = input.theme?.trim();
  const spotlightDistrict = input.spotlightDistrict?.trim();
  const stationIds = uniqueStrings(input.stationIds ?? []);
  const districtNames = uniqueStrings(input.districtNames ?? []);

  if (
    !theme &&
    !spotlightDistrict &&
    stationIds.length === 0 &&
    districtNames.length === 0
  ) {
    return undefined;
  }

  return {
    ...(theme ? { theme } : {}),
    ...(stationIds.length > 0 ? { stationIds } : {}),
    ...(districtNames.length > 0 ? { districtNames } : {}),
    ...(spotlightDistrict ? { spotlightDistrict } : {}),
  };
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
  /** Lado contrario: estaciones que suelen llenarse, con los huecos que tengan ahora. */
  fullStations?: SocialStationSelection<SocialStationCandidate> | null;
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

/**
 * Las estaciones habituales sin bicis (o con pocas), como dato de una story cuyo
 * titular va por el otro lado. Con `includeCohort`, tambien lista la cohorte
 * habitual cuando ahora mismo tiene bicis. `null` si no hay nada que destacar.
 */
function usualEmptyFact(
  selection: SocialStationSelection<SocialStationCandidate> | null | undefined,
  includeCohort = false
): SocialStoryFact | null {
  if (!selection || selection.stations.length === 0) {
    return null;
  }

  const hasProblem = selection.mode === 'empty' || selection.mode === 'low';
  if (!hasProblem && !(includeCohort && selection.mode === 'none')) {
    return null;
  }

  return {
    label: 'Estaciones que suelen vaciarse',
    value: selection.stations
      .slice(0, 3)
      .map((station) => {
        const detail =
          selection.mode === 'empty' ? 'sin bicis' : bikesLabel(station.bikesAvailable);
        return `${normalize(station.name)} (${detail})`;
      })
      .join(' · '),
  };
}

/** Espejo de `usualEmptyFact`: las habituales sin huecos (o con pocos). */
function usualFullFact(
  selection: SocialStationSelection<SocialStationCandidate> | null | undefined
): SocialStoryFact | null {
  if (!selection || selection.stations.length === 0) {
    return null;
  }

  // `none` = la cohorte habitual sin problema ahora mismo. La story de manana
  // la pasa siempre para contar las dos caras; en el resto de slots no hay
  // estaciones en ese modo y el hecho se omite.
  if (
    selection.mode !== 'full' &&
    selection.mode !== 'low' &&
    selection.mode !== 'none'
  ) {
    return null;
  }

  return {
    label: 'Estaciones que suelen llenarse',
    value: selection.stations
      .slice(0, 3)
      .map((station) => {
        const detail =
          selection.mode === 'full' ? 'sin huecos' : anchorsLabel(station.anchorsFree);
        return `${normalize(station.name)} (${detail})`;
      })
      .join(' · '),
  };
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
 * pinta 4 hechos, asi que en un dia especial la red es lo que se cae). Si hay
 * estaciones habituales sin huecos, van justo despues de la alternativa para que
 * quien llega al trabajo sepa donde dejar la bici. Sin distritos ni barras:
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
    usualFullFact(input.fullStations),
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
    metadata: contentMetadata({
      stationIds: [
        ...stations.map((station) => station.id),
        ...(input.fullStations?.stations ?? []).map((station) => station.id),
        ...(input.dropping ?? []).map((entry) => entry.stationId),
      ],
    }),
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
  /** Lado contrario: estaciones que suelen vaciarse, con las bicis que tengan ahora. */
  emptyStations?: SocialStationSelection<SocialStationCandidate> | null;
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

function fullHeadline(selection: SocialStationSelection<SocialStationCandidate>): string {
  const count = selection.stations.length;
  const usual = `${pluralize(count, 'estación que suele', 'estaciones que suelen')} llenarse`;

  return `${formatInteger(count)} ${usual}, ${selection.mode === 'full' ? 'sin huecos' : 'con pocos huecos'}`;
}

/**
 * "Donde dejar la bici": espejo de la story de la manana. Un solo mensaje, con
 * una estacion cercana con huecos como salida.
 */
function fullStationsStory(
  selection: SocialStationSelection<SocialStationCandidate>,
  alternative: SocialNearbyAlternative | null | undefined,
  emptyStations: SocialStationSelection<SocialStationCandidate> | null | undefined,
  profiles: readonly SocialEveningStationProfile[] | undefined,
  network: SocialNetworkContext,
  cause: SocialCause | null | undefined
): { headline: string; facts: SocialStoryFact[]; accent: string } {
  const isFull = selection.mode === 'full';
  const names = selection.stations.slice(0, 3).map((station) => {
    const name = normalize(station.name);
    return isFull ? name : `${name} (${anchorsLabel(station.anchorsFree)})`;
  });

  return {
    headline: fullHeadline(selection),
    facts: compactFacts([
      {
        label: isFull ? 'Estaciones sin huecos' : 'Estaciones con pocos huecos',
        value: names.join(' · '),
      },
      alternativeFact(selection, alternative),
      usualEmptyFact(emptyStations, true),
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
 *
 * Salvo en las alertas y rachas, que hablan de una sola estacion, las
 * estaciones habituales sin bicis se anaden como dato ("donde coger bici"),
 * tengan bicis ahora o no.
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
            input.emptyStations,
            input.eveningProfiles,
            input.network,
            cause
          )
        : anomaly
        ? anomalyStory(anomaly, cause)
        : returnPulseStory(districts, input.network, framing.isWeekend, cause);

  const bars = districtBars(districts, 3);
  // El lado contrario ya va dentro de "donde dejar la bici"; en el resto de
  // ramas "genericas" se anade al final, tambien cuando ahora tiene bicis. Las
  // alertas y rachas hablan de una sola estacion y no lo llevan.
  const emptyFact = !alert && !episode && !fullStations ? usualEmptyFact(input.emptyStations, true) : null;
  const facts = emptyFact ? [...branch.facts, emptyFact] : branch.facts;

  // Metadata de lo que realmente sale: la rama de alerta/racha habla de una
  // sola estacion; la de "donde dejar la bici" anade el lado contrario.
  const shownStationIds: string[] = [];
  if (alert) {
    shownStationIds.push(alert.stationId);
  } else if (episode) {
    shownStationIds.push(episode.stationId);
  } else if (fullStations) {
    shownStationIds.push(...fullStations.stations.map((station) => station.id));
    if (input.emptyStations && input.emptyStations.stations.length > 0) {
      shownStationIds.push(
        ...input.emptyStations.stations.map((station) => station.id)
      );
    }
  } else if (emptyFact && input.emptyStations) {
    shownStationIds.push(
      ...input.emptyStations.stations.map((station) => station.id)
    );
  }

  const showsDistricts = Boolean(anomaly) || (!alert && !episode && !fullStations);
  const shownDistrictNames = showsDistricts
    ? [
        ...bars.map((bar) => bar.label),
        ...(!alert && !episode && !fullStations && !anomaly
          ? topDistrictsByActivity(districts, 2).map((entry) => entry.district)
          : []),
      ]
    : [];

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
    metadata: contentMetadata({
      stationIds: shownStationIds,
      districtNames: shownDistrictNames,
    }),
  };
}

/* -------------------------------------------------------------------------- */
/* Mediodía                                                                   */
/* -------------------------------------------------------------------------- */

export type SocialMiddayStoryInput = {
  dateKey: string;
  /** Estaciones que suelen vaciarse (donde coger bici). */
  emptyStations: SocialStationSelection<SocialStationCandidate>;
  /** Estaciones que suelen llenarse (donde dejar la bici). */
  fullStations: SocialStationSelection<SocialStationCandidate>;
  /** Estacion cercana con bicis para quien encuentra la suya vacia. */
  bikesAlternative?: SocialNearbyAlternative | null;
  /** Estacion cercana con huecos para quien encuentra la suya llena. */
  anchorsAlternative?: SocialNearbyAlternative | null;
  network: SocialNetworkContext;
  cause?: SocialCause | null;
  /** Hora real de la foto de datos; por defecto, 13:00. */
  dataWindow?: string;
};

function hasEmptyProblem(selection: SocialStationSelection<SocialStationCandidate>): boolean {
  return selection.stations.length > 0 && (selection.mode === 'empty' || selection.mode === 'low');
}

function hasFullProblem(selection: SocialStationSelection<SocialStationCandidate>): boolean {
  return selection.stations.length > 0 && (selection.mode === 'full' || selection.mode === 'low');
}

function middayHeadline(
  empty: SocialStationSelection<SocialStationCandidate>,
  full: SocialStationSelection<SocialStationCandidate>
): string {
  const emptyProblem = hasEmptyProblem(empty);
  const fullProblem = hasFullProblem(full);

  if (emptyProblem && fullProblem) {
    const emptyCount = empty.stations.length;
    const fullCount = full.stations.length;
    const emptyState = empty.mode === 'empty' ? 'sin bicis' : 'con pocas bicis';
    const fullState = full.mode === 'full' ? 'sin huecos' : 'con pocos huecos';

    return `${formatInteger(emptyCount)} ${pluralize(emptyCount, 'estación habitual', 'estaciones habituales')} ${emptyState} y ${formatInteger(fullCount)} ${fullState}`;
  }

  if (emptyProblem) {
    return morningHeadline(empty);
  }

  if (fullProblem) {
    return fullHeadline(full);
  }

  return 'Hay bicis y huecos en las estaciones habituales';
}

/**
 * Story de las 13:00. Un solo mensaje con las dos caras de la hora: donde
 * coger bici (estaciones que suelen vaciarse) y donde dejarla (las que suelen
 * llenarse), cada una con su alternativa cercana. Titular segun cuales tengan
 * problema ahora. Devuelve `null` si no hay ni estaciones ni red.
 */
export function buildMiddayStory(input: SocialMiddayStoryInput): SocialStory | null {
  const network = input.network;
  const emptyProblem = hasEmptyProblem(input.emptyStations);
  const fullProblem = hasFullProblem(input.fullStations);

  if (!emptyProblem && !fullProblem && network.totalStations <= 0) {
    return null;
  }

  const framing = getDayFraming(input.dateKey);
  const dataWindow = input.dataWindow ?? SOCIAL_MIDDAY_WINDOW;
  const facts = compactFacts([
    usualEmptyFact(input.emptyStations),
    emptyProblem ? alternativeFact(input.emptyStations, input.bikesAlternative) : null,
    usualFullFact(input.fullStations),
    fullProblem ? alternativeFact(input.fullStations, input.anchorsAlternative) : null,
    todayFact(input.cause),
    networkFact(network),
  ]);

  const headline = middayHeadline(input.emptyStations, input.fullStations);
  const hard =
    (emptyProblem && input.emptyStations.mode === 'empty') ||
    (fullProblem && input.fullStations.mode === 'full');
  const accent = hard ? ACCENT_RED : emptyProblem || fullProblem ? ACCENT_AMBER : ACCENT_TEAL;

  return {
    slot: 'midday',
    family: 'daily-story',
    dateKey: input.dateKey,
    headline,
    facts,
    footer: SOCIAL_STORY_FOOTER,
    caption: buildStoryText({
      slot: 'midday',
      dateKey: input.dateKey,
      headline,
      dataWindow,
    }),
    altText: buildSocialAltText({
      kind: 'story',
      slot: 'midday',
      dateKey: input.dateKey,
      headline,
      facts,
      dataWindow,
      cause: input.cause,
    }),
    kicker: `${framing.middayKicker} · ${dataWindow}`,
    accent,
    metadata: contentMetadata({
      stationIds: [
        ...input.emptyStations.stations.map((station) => station.id),
        ...input.fullStations.stations.map((station) => station.id),
      ],
    }),
  };
}

/* -------------------------------------------------------------------------- */
/* Pieza semanal de variedad                                                  */
/* -------------------------------------------------------------------------- */

const FEATURE_THEME_KICKER: Record<SocialFeatureTheme, string> = {
  station: 'Estación del día',
  explainer: 'Cómo funciona',
  record: 'Récord del mes',
  myth: 'Mito vs dato',
  network: 'La red en cifras',
};

const FEATURE_THEME_ACCENT: Record<SocialFeatureTheme, string> = {
  station: ACCENT_BLUE,
  explainer: ACCENT_TEAL,
  record: ACCENT_AMBER,
  myth: ACCENT_TEAL,
  network: ACCENT_BLUE,
};

export type SocialFeatureStoryInput = {
  dateKey: string;
  theme: SocialFeatureTheme;
  /** Snapshot actual de estaciones. */
  stations: readonly SocialStationCandidate[];
  /** Actividad de la última semana completa por estación. */
  demand?: readonly SocialDistrictDemandRow[];
  /** Horas vacia/llena de la ultima semana por estacion. */
  friction?: readonly SocialDistrictFrictionRow[];
  /** Estaciones que salieron en piezas recientes; solo es una preferencia. */
  recentStationIds?: readonly string[];
  /** Informe mensual ya construido; solo lo usan `record` y `myth`. */
  report?: MonthlyReport | null;
};

type FeatureStationRow = {
  station: SocialStationCandidate;
  activityIndex: number;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
  frictionRate: number;
};

function featureStory(input: {
  dateKey: string;
  theme: SocialFeatureTheme;
  headline: string;
  facts: readonly SocialStoryFact[];
  stationIds?: readonly string[];
  districtNames?: readonly string[];
  bars?: readonly SocialBar[];
  barsLabel?: string;
}): SocialStory {
  return {
    slot: 'feature',
    family: 'feature-story',
    dateKey: input.dateKey,
    headline: input.headline,
    facts: input.facts,
    footer: SOCIAL_STORY_FOOTER,
    caption: buildStoryText({
      slot: 'feature',
      dateKey: input.dateKey,
      headline: input.headline,
      dataWindow: SOCIAL_FEATURE_WINDOW,
    }),
    altText: buildSocialAltText({
      kind: 'story',
      slot: 'feature',
      dateKey: input.dateKey,
      headline: input.headline,
      facts: input.facts,
      dataWindow: SOCIAL_FEATURE_WINDOW,
    }),
    kicker: `${FEATURE_THEME_KICKER[input.theme]} · ${SOCIAL_FEATURE_WINDOW}`,
    accent: FEATURE_THEME_ACCENT[input.theme],
    ...(input.bars && input.bars.length > 0
      ? { bars: input.bars, barsLabel: input.barsLabel ?? BARS_LABEL }
      : {}),
    metadata: contentMetadata({
      theme: input.theme,
      stationIds: input.stationIds,
      districtNames: input.districtNames,
    }),
  };
}

function featureStationRows(input: SocialFeatureStoryInput): FeatureStationRow[] {
  const stationById = new Map(input.stations.map((station) => [station.id, station]));
  const activityByStation = new Map(
    (input.demand ?? []).map((row) => [row.stationId, Math.max(0, row.activityIndex)])
  );

  const rows: FeatureStationRow[] = [];
  for (const friction of input.friction ?? []) {
    const station = stationById.get(friction.stationId);
    if (!station || friction.totalHours <= 0) {
      continue;
    }

    const frictionHours = Math.max(0, friction.emptyHours) + Math.max(0, friction.fullHours);
    rows.push({
      station,
      activityIndex: activityByStation.get(friction.stationId) ?? 0,
      emptyHours: Math.max(0, friction.emptyHours),
      fullHours: Math.max(0, friction.fullHours),
      totalHours: friction.totalHours,
      frictionRate: frictionHours / friction.totalHours,
    });
  }

  return rows;
}

function featureStationBars(rows: readonly FeatureStationRow[]): SocialBar[] {
  return [...rows]
    .filter((entry) => entry.activityIndex > 0)
    .sort(
      (left, right) =>
        right.activityIndex - left.activityIndex ||
        compareText(left.station.name, right.station.name)
    )
    .slice(0, 5)
    .map((entry) => ({ label: normalize(entry.station.name), value: entry.activityIndex }));
}

/** Estacion con mas friccion de la semana; la gravedad manda sobre la novedad. */
function buildFeatureStationStory(
  input: SocialFeatureStoryInput
): SocialStory | null {
  const rows = featureStationRows(input);
  if (rows.length === 0) {
    return null;
  }

  // Evita muestras de una sola hora sin descartar la estacion si toda la red
  // tiene poca cobertura.
  const solid = rows.filter((entry) => entry.totalHours >= 24);
  const candidates = solid.length > 0 ? solid : rows;
  const recent = new Set(input.recentStationIds ?? []);
  const fresh = candidates.filter((entry) => !recent.has(entry.station.id));
  const pool = fresh.length > 0 ? fresh : candidates;

  const picked = [...pool].sort(
    (left, right) =>
      right.frictionRate - left.frictionRate ||
      right.activityIndex - left.activityIndex ||
      compareText(left.station.name, right.station.name)
  )[0]!;

  const frictionHours = picked.emptyHours + picked.fullHours;
  const headline =
    picked.frictionRate >= 0.2
      ? `${normalize(picked.station.name)}: muchas horas sin bicis o sin huecos`
      : `${normalize(picked.station.name)}: una estación con mucho uso`;

  return featureStory({
    dateKey: input.dateKey,
    theme: 'station',
    headline,
    facts: [
      {
        label: 'Uso esta semana',
        value: `${formatInteger(picked.activityIndex)} puntos`,
      },
      {
        label: 'Horas sin bicis o sin huecos',
        value: `${formatInteger(frictionHours)} de ${formatInteger(picked.totalHours)} h · ${formatPercent(picked.frictionRate)}`,
      },
      {
        label: 'Ahora mismo',
        value: `${formatInteger(picked.station.bikesAvailable)} bicis y ${formatInteger(picked.station.anchorsFree)} huecos`,
      },
    ],
    stationIds: [picked.station.id],
    bars: featureStationBars(rows),
  });
}

function buildFeatureExplainerStory(
  input: SocialFeatureStoryInput
): SocialStory | null {
  if (input.stations.length === 0) {
    return null;
  }

  const frictionHours = (input.friction ?? []).reduce(
    (total, row) => total + Math.max(0, row.emptyHours) + Math.max(0, row.fullHours),
    0
  );

  return featureStory({
    dateKey: input.dateKey,
    theme: 'explainer',
    headline: 'Los puntos de actividad, en una frase',
    facts: [
      {
        label: 'Qué son',
        value: 'Cuánto cambian las bicis y los huecos en cada estación',
      },
      {
        label: 'Para qué sirven',
        value: 'Comparar barrios de distinto tamaño sin premiar al más grande',
      },
      {
        label: 'La red esta semana',
        value: `${formatInteger(input.stations.length)} estaciones · ${formatInteger(frictionHours)} h sin bicis o sin huecos`,
      },
    ],
    districtNames: [],
  });
}

function buildFeatureRecordStory(input: SocialFeatureStoryInput): SocialStory | null {
  const report = input.report;
  if (!report?.hasReport || !report.coverage?.isComplete) {
    return null;
  }

  const monthLabel = formatMonthLabel(report.monthKey);
  const topStation = report.topStations?.[0] ?? null;
  const mostActive = report.districts?.mostActive?.[0] ?? null;

  if (!topStation && !mostActive) {
    return null;
  }

  const trendBars: SocialBar[] = (report.trends?.monthly ?? [])
    .filter((entry) => entry.monthKey <= report.monthKey)
    .slice(-5)
    .map((entry) => ({
      label: formatMonthName(entry.monthKey),
      value: entry.demandScore,
    }))
    .filter((bar) => Number.isFinite(bar.value) && bar.value > 0);

  return featureStory({
    dateKey: input.dateKey,
    theme: 'record',
    headline: `Los récords de ${monthLabel}`,
    facts: compactFacts([
      topStation
        ? {
            label: 'Estación con más uso',
            value: `${normalize(topStation.stationName)} · ${formatDecimal(topStation.avgDemand)} ${activityIndexUnits.perDay}`,
          }
        : null,
      mostActive
        ? {
            label: 'Distrito con más uso',
            value: `${normalize(mostActive.district)} · ${formatInteger(mostActive.demandScore)} puntos`,
          }
        : null,
      monthlyPeakHourFact(report.headline?.peakHour),
    ]),
    stationIds: topStation ? [topStation.stationId] : [],
    districtNames: mostActive ? [mostActive.district] : [],
    bars: trendBars,
    barsLabel: 'Puntos de actividad al mes',
  });
}

function buildFeatureMythStory(input: SocialFeatureStoryInput): SocialStory | null {
  const report = input.report;
  if (!report?.hasReport) {
    return null;
  }

  const weekendGap = weekdayWeekendFact(report.weekdayWeekendProfile);
  if (!weekendGap) {
    return null;
  }

  return featureStory({
    dateKey: input.dateKey,
    theme: 'myth',
    headline: '¿La Bizi se usa igual todos los días?',
    facts: [
      weekendGap,
      {
        label: 'Uso del mes',
        value: `${formatInteger(report.headline?.demandScore ?? 0)} ${activityIndexUnits.perMonth}`,
      },
      {
        label: 'Cómo leerlo',
        value: 'Comparamos el uso medio por día laborable y por día de fin de semana',
      },
    ],
  });
}

function buildFeatureNetworkStory(input: SocialFeatureStoryInput): SocialStory | null {
  const rows = featureStationRows(input);
  if (input.stations.length === 0 || rows.length === 0) {
    return null;
  }

  const activity = rows.reduce((total, entry) => total + entry.activityIndex, 0);
  const frictionHours = rows.reduce(
    (total, entry) => total + entry.emptyHours + entry.fullHours,
    0
  );
  const totalHours = rows.reduce((total, entry) => total + entry.totalHours, 0);
  const frictionRate = totalHours > 0 ? frictionHours / totalHours : 0;

  return featureStory({
    dateKey: input.dateKey,
    theme: 'network',
    headline: 'La red de Bizi esta semana',
    facts: [
      {
        label: 'Estaciones en la red',
        value: formatInteger(input.stations.length),
      },
      {
        label: 'Puntos de actividad',
        value: `${formatInteger(activity)} en la semana`,
      },
      {
        label: 'Horas sin bicis o sin huecos',
        value: `${formatInteger(frictionHours)} de ${formatInteger(totalHours)} h · ${formatPercent(frictionRate)}`,
      },
    ],
    bars: featureStationBars(rows),
  });
}

/**
 * Pieza semanal de variedad. El tema llega ya rotado por `getFeatureTheme`;
 * cada tema devuelve `null` si no tiene datos suficientes, y el slot se salta
 * antes que publicar contenido de relleno.
 */
export function buildFeatureStory(input: SocialFeatureStoryInput): SocialStory | null {
  switch (input.theme) {
    case 'station':
      return buildFeatureStationStory(input);
    case 'explainer':
      return buildFeatureExplainerStory(input);
    case 'record':
      return buildFeatureRecordStory(input);
    case 'myth':
      return buildFeatureMythStory(input);
    case 'network':
      return buildFeatureNetworkStory(input);
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Carrusel semanal                                                           */
/* -------------------------------------------------------------------------- */

export type SocialWeeklyCarouselInput = {
  week: SocialWeekRange;
  districts: readonly SocialDistrictStats[];
  /**
   * Barrio destacado por rotacion, ya elegido por el job. Es un foco editorial,
   * no un ranking; si falta, el carrusel mantiene sus cinco laminas.
   */
  spotlightDistrict?: SocialDistrictStats | null;
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
 * Carrusel semanal de 6 laminas: portada, top distritos, crecimiento, tension,
 * barrio del dia y CTA. Sin barrio destacado mantiene 5 (sin la lamina extra).
 * Devuelve `null` sin distritos, porque no hay historia que contar.
 */
export function buildWeeklyCarousel(input: SocialWeeklyCarouselInput): SocialCarousel | null {
  if (input.districts.length === 0) {
    return null;
  }

  const weekLabel = formatSocialWeekLabel(input.week.weekStart, input.week.weekEnd);
  const top = topDistrictsByActivity(input.districts, 3);
  const growth = topDistrictsByGrowth(input.districts, 1)[0] ?? null;
  const friction = topDistrictsByFriction(input.districts, 1)[0] ?? null;
  const spotlight = input.spotlightDistrict ?? null;
  // Titular con conclusion; la semana va en el kicker y en el gancho del caption.
  const coverHeadline = top[0]
    ? `${normalize(top[0].district)}: donde más se usa la Bizi`
    : 'La Bizi esta semana';
  const bars = districtBars(input.districts, 5);
  // Distritos que aparecen en las laminas: top de uso (portada/barras),
  // crecimiento y friccion.
  const shownDistrictNames = [
    ...topDistrictsByActivity(input.districts, 5).map((entry) => entry.district),
    ...(growth ? [growth.district] : []),
    ...(friction ? [friction.district] : []),
    ...(spotlight ? [spotlight.district] : []),
  ];

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

  // Foco editorial rotativo: no dice que el barrio sea el mejor ni el peor,
  // solo saca del top habitual a un distrito distinto cada semana.
  const spotlightFacts: SocialStoryFact[] = spotlight
    ? compactFacts([
        {
          label: 'Estaciones del barrio',
          value: formatInteger(spotlight.stationCount),
        },
        {
          label: 'Uso medio por estación',
          value: `${formatInteger(activityPerStation(spotlight))} puntos`,
        },
        spotlight.totalHours > 0
          ? {
              label: 'Horas sin bicis o sin huecos',
              value: `${formatInteger(spotlight.emptyHours + spotlight.fullHours)} de ${formatInteger(spotlight.totalHours)} h · ${formatPercent(spotlight.frictionRate)}`,
            }
          : { label: 'Disponibilidad', value: 'Sin horas críticas registradas' },
      ])
    : [];

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
    ...(spotlight
      ? [
          slide(
            'Barrio del día',
            `Este lunes miramos a ${normalize(spotlight.district)}`,
            spotlightFacts,
            ACCENT_BLUE
          ),
        ]
      : []),
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
      cta: buildSocialCta({ slot: 'weekly' }),
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
    metadata: contentMetadata({
      districtNames: shownDistrictNames,
      spotlightDistrict: spotlight?.district,
    }),
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

type MonthlyDistrict = MonthlyReport['districts']['mostActive'][number];

function districtUsePerStation(district: MonthlyDistrict): number {
  return district.stations > 0 ? district.demandScore / district.stations : 0;
}

/**
 * Ranking territorial justo entre barrios de distinto tamano. Usa `all` cuando
 * el informe lo trae; con snapshots antiguos cae a la union de los tres
 * rankings, que cubre hasta 12 de los 15 barrios.
 */
function monthlyDistrictsByStation(report: MonthlyReport): MonthlyDistrict[] {
  const all = report.districts?.all ?? [];
  const source =
    all.length > 0
      ? all
      : [
          ...(report.districts?.mostActive ?? []),
          ...(report.districts?.leastActive ?? []),
          ...(report.districts?.undersupplied ?? []),
        ];

  const unique = new Map<string, MonthlyDistrict>();
  for (const district of source) {
    if (!unique.has(district.district)) {
      unique.set(district.district, district);
    }
  }

  return Array.from(unique.values())
    .filter((district) => district.stations > 0)
    .sort(
      (left, right) =>
        districtUsePerStation(right) - districtUsePerStation(left) ||
        left.district.localeCompare(right.district, 'es')
    );
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
  const undersupplied = report.districts?.undersupplied?.[0] ?? null;
  const topStation = report.topStations?.[0] ?? null;
  const worstFriction = report.problemSpots?.worstFriction?.[0] ?? null;
  const districtsByStation = monthlyDistrictsByStation(report);
  const topDistrict = districtsByStation[0] ?? null;
  const bottomDistrict = districtsByStation[districtsByStation.length - 1] ?? null;
  const monthPath = input.reportPath ?? `/informes/${report.monthKey}`;
  const publicUrl = `datosbizi.com${monthPath.startsWith('/') ? monthPath : `/${monthPath}`}`;
  const coverHeadline = `La Bizi en ${monthLabel}`;

  // La lamina pinta 5 barras: las 5 ultimas, para que el mes del informe (el
  // ultimo) nunca quede fuera.
  const trendBars: SocialBar[] = (report.trends?.monthly ?? [])
    .filter((entry) => entry.monthKey <= report.monthKey)
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

  const stationFacts: SocialStoryFact[] = compactFacts([
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

  // Los rankings del informe no se limitan al primer barrio: esta lamina da
  // contexto territorial para que el post no parezca la historia de un solo
  // distrito. Se mide por estacion para que un barrio grande no gane solo por
  // tener mas estaciones.
  const districtBars: SocialBar[] = districtsByStation
    .slice(0, 5)
    .map((district) => ({
      label: normalize(district.district),
      value: Math.round(districtUsePerStation(district)),
    }))
    .filter((bar) => Number.isFinite(bar.value) && bar.value > 0);

  const barrioFacts: SocialStoryFact[] = compactFacts([
    topDistrict
      ? {
          label: 'Barrio con más uso por estación',
          value: `${normalize(topDistrict.district)} · ${formatInteger(Math.round(districtUsePerStation(topDistrict)))} puntos`,
        }
      : null,
    bottomDistrict && bottomDistrict.district !== topDistrict?.district
      ? {
          label: 'Barrio con menos uso por estación',
          value: `${normalize(bottomDistrict.district)} · ${formatInteger(Math.round(districtUsePerStation(bottomDistrict)))} puntos`,
        }
      : null,
    undersupplied
      ? {
          label: 'Mayor proporción de horas sin bicis o sin huecos',
          value: `${normalize(undersupplied.district)} · ${formatPercent(undersupplied.frictionRate)}`,
        }
      : null,
  ]);

  const shownDistrictNames = [
    ...districtsByStation.slice(0, 5).map((entry) => entry.district),
    ...(undersupplied ? [undersupplied.district] : []),
  ];

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
      'Estaciones del mes',
      topStation
        ? `${normalize(topStation.stationName)} es la estación con más uso`
        : 'Estaciones del mes',
      stationFacts.length > 0
        ? stationFacts
        : [{ label: 'Estaciones', value: 'Sin estaciones destacadas este mes' }],
      ACCENT_TEAL
    ),
    ...(barrioFacts.length > 0 || districtBars.length > 0
      ? [
          slide(
            'Barrios del mes',
            'El uso por barrio, estación a estación',
            barrioFacts,
            ACCENT_BLUE,
            {
              bars: districtBars,
              barsLabel: 'Puntos de actividad por estación',
            }
          ),
        ]
      : []),
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
      hook: topDistrict
        ? `${coverHeadline}: ${normalize(topDistrict.district)} lidera el uso por estación`
        : report.comparison?.isComparable
          ? `${coverHeadline}: ${trendHeadline(report.comparison.trend).toLowerCase()}`
          : coverHeadline,
      facts: captionFacts,
      // Solo el titular del balance: ya lleva la cifra ("El uso creció un 12%…") y
      // el detalle repite "índice de actividad", jerga que no queremos en el feed.
      context: normalize(report.balance.headline),
      cta: buildSocialCta({
        slot: 'monthly',
        path: monthPath,
        label: 'Lee el informe completo en',
      }),
    }),
    altText: buildSocialAltText({
      kind: 'carousel',
      slot: 'monthly',
      dateKey: `${report.monthKey}-01`,
      headline: coverHeadline,
      slides,
    }),
    slides,
    metadata: contentMetadata({
      stationIds: [topStation?.stationId, worstFriction?.stationId].filter(
        (stationId): stationId is string => typeof stationId === 'string'
      ),
      districtNames: shownDistrictNames,
    }),
  };
}
