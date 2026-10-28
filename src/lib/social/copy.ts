/**
 * Textos y presentacion del agente social.
 *
 * Redes sociales = publico general, sin jerga del dashboard. Cada pieza cuenta
 * una sola cosa en lenguaje llano: "sin bicis", "sin huecos", "pocas bicis" y
 * "uso" (estimado). No se usan "tension", "estaciones clave" ni "GBFS". Nunca
 * se habla de "viajes": la unica excepcion es el aviso legal. Los "puntos de
 * actividad" solo aparecen donde se explican (ultima lamina del semanal).
 *
 * Este modulo es puro (sin React, rutas ni red). Solo compone cadenas a partir
 * de hechos ya calculados; los numeros pasan siempre por `format.ts`.
 */

import { formatInteger, formatPercent, formatRatioDelta, formatRatioMagnitude } from '@/lib/format';
import { formatMonthLabel } from '@/lib/months';
import { getIsoWeekday, isValidDateKey, parseDateKey } from '@/lib/social/data';
import type {
  SocialCarouselSlide,
  SocialSlot,
  SocialStoryFact,
} from '@/lib/social/types';

export const SOCIAL_HASHTAGS = [
  '#BiziZaragoza',
  '#Zaragoza',
  '#MovilidadSostenible',
  '#Bicicleta',
  '#DatosAbiertos',
] as const;

export const SOCIAL_HASHTAGS_TEXT = SOCIAL_HASHTAGS.join(' ');

/** Aviso legal obligatorio en el feed. */
export const SOCIAL_FEED_DISCLAIMER =
  'Datos abiertos de Bizi Zaragoza. Estimación a partir de las bicis disponibles en cada estación, no viajes reales.';

/** Pie comun de stories y laminas. */
export const SOCIAL_STORY_FOOTER = 'datosbizi.com · datos abiertos de Bizi Zaragoza';
export const SOCIAL_FEED_FOOTER = SOCIAL_STORY_FOOTER;

export const SOCIAL_FEED_CTA = 'Explora tu barrio en datosbizi.com';

export const SOCIAL_CAPTION_MAX_LENGTH = 2200;
export const SOCIAL_ALT_TEXT_MAX_LENGTH = 1000;
export const SOCIAL_STORY_TEXT_MAX_LENGTH = 280;

/** Hora de la foto de datos de la story de la mañana (la ventana real se pasa en el input). */
export const SOCIAL_MORNING_WINDOW = '08:30';
export const SOCIAL_MIDDAY_WINDOW = '13:00';
export const SOCIAL_AFTERNOON_WINDOW = '17:00–18:30';

const SPANISH_LOCALE = 'es-ES';

const dayMonthFormatter = new Intl.DateTimeFormat(SPANISH_LOCALE, {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

const monthFormatter = new Intl.DateTimeFormat(SPANISH_LOCALE, {
  month: 'long',
  timeZone: 'UTC',
});

const longDateFormatter = new Intl.DateTimeFormat(SPANISH_LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

/** Recorta de forma determinista sin partir palabras cuando se puede. */
export function truncateSocialText(value: string, maxLength: number): string {
  const normalized = normalizeText(value);
  const safeMax = Math.max(1, Math.trunc(maxLength));

  if (normalized.length <= safeMax) {
    return normalized;
  }

  const slice = normalized.slice(0, Math.max(0, safeMax - 1)).trimEnd();
  const lastSpace = slice.lastIndexOf(' ');
  const body = lastSpace > safeMax * 0.6 ? slice.slice(0, lastSpace) : slice;

  return `${body.trimEnd()}…`;
}

function clampText(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : truncateSocialText(value, maxLength);
}

/** "semana del 19 al 25 de octubre" / "semana del 26 de octubre al 1 de noviembre". */
export function formatSocialWeekLabel(startDateKey: string, endDateKey: string): string {
  if (!isValidDateKey(startDateKey) || !isValidDateKey(endDateKey)) {
    return 'semana sin fechas válidas';
  }

  const start = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);

  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    if (start.getUTCMonth() === end.getUTCMonth()) {
      const month = monthFormatter.format(start);
      return `semana del ${start.getUTCDate()} al ${end.getUTCDate()} de ${month}`;
    }

    return `semana del ${dayMonthFormatter.format(start)} al ${dayMonthFormatter.format(end)}`;
  }

  return `semana del ${dayMonthFormatter.format(start)} de ${start.getUTCFullYear()} al ${dayMonthFormatter.format(end)} de ${end.getUTCFullYear()}`;
}

/** Etiqueta legible de una fecha `YYYY-MM-DD` para alt text y captions internos. */
export function formatSocialDateLabel(dateKey: string): string {
  if (!isValidDateKey(dateKey)) {
    return dateKey;
  }

  return longDateFormatter.format(parseDateKey(dateKey));
}

export function formatSocialMonthLabel(monthKey: string): string {
  return formatMonthLabel(monthKey);
}

export function isWeekendDateKey(dateKey: string): boolean {
  if (!isValidDateKey(dateKey)) {
    return false;
  }

  return getIsoWeekday(dateKey) >= 6;
}

export type SocialDayFraming = {
  isWeekend: boolean;
  morningKicker: string;
  middayKicker: string;
  afternoonKicker: string;
  /** Etiqueta corta para captions y alt text. */
  label: 'Fin de semana' | 'Entre semana';
};

/**
 * Encuadre diario. El kicker dice de que va la pieza ("Bizi esta mañana"). El
 * fin de semana conserva los dos slots pero evita el lenguaje de ida al
 * trabajo. Los festivos solo se nombran si el llamante aporta una causa curada.
 */
export function getDayFraming(dateKey: string): SocialDayFraming {
  const weekend = isWeekendDateKey(dateKey);

  return {
    isWeekend: weekend,
    morningKicker: weekend ? 'Bizi este fin de semana' : 'Bizi esta mañana',
    middayKicker: weekend ? 'Bizi este fin de semana · mediodía' : 'Bizi a mediodía',
    afternoonKicker: weekend ? 'Bizi este fin de semana · tarde' : 'Bizi esta tarde',
    label: weekend ? 'Fin de semana' : 'Entre semana',
  };
}

export function buildHashtags(extra: readonly string[] = []): string[] {
  const merged = [...SOCIAL_HASHTAGS, ...extra.map((tag) => tag.trim()).filter(Boolean)];
  return Array.from(new Set(merged)).slice(0, 5);
}

function formatCaptionFact(fact: SocialStoryFact): string {
  return `• ${normalizeText(fact.label)}: ${normalizeText(fact.value)}`;
}

export type FeedCaptionInput = {
  hook: string;
  facts?: readonly SocialStoryFact[];
  context?: string | null;
  cta?: string | null;
  hashtags?: readonly string[];
  disclaimer?: string;
};

/**
 * Caption del feed: gancho, 2-3 hechos con cifras, contexto, CTA, 5 hashtags y
 * aviso legal. El bloque final se reserva antes de recortar el cuerpo para que
 * nunca se pierdan los hashtags ni el disclaimer.
 */
export function buildFeedCaption(input: FeedCaptionInput): string {
  const hook = normalizeText(input.hook);
  const facts = (input.facts ?? []).slice(0, 3).map(formatCaptionFact);
  const context = input.context ? normalizeText(input.context) : '';
  const cta = input.cta ? normalizeText(input.cta) : '';
  const hashtags = buildHashtags(input.hashtags);
  const disclaimer = normalizeText(input.disclaimer ?? SOCIAL_FEED_DISCLAIMER);

  const tail = [hashtags.join(' '), disclaimer].filter(Boolean).join('\n\n');
  const safeTail =
    tail.length <= SOCIAL_CAPTION_MAX_LENGTH
      ? tail
      : truncateSocialText(tail, SOCIAL_CAPTION_MAX_LENGTH);

  const blocks = [hook];
  if (facts.length > 0) {
    blocks.push(facts.join('\n'));
  }
  if (context) {
    blocks.push(context);
  }
  if (cta) {
    blocks.push(cta);
  }

  const body = blocks.filter(Boolean).join('\n\n');
  const available = Math.max(0, SOCIAL_CAPTION_MAX_LENGTH - safeTail.length - 2);
  const safeBody = available > 0 ? clampText(body, available) : '';

  return [safeBody, safeTail].filter(Boolean).join('\n\n').slice(0, SOCIAL_CAPTION_MAX_LENGTH);
}

const STORY_SLOT_LABEL: Record<StoryTextInput['slot'], string> = {
  morning: 'Story de la mañana',
  midday: 'Story del mediodía',
  afternoon: 'Story de la tarde',
};

export type StoryTextInput = {
  slot: Extract<SocialSlot, 'morning' | 'midday' | 'afternoon'>;
  dateKey: string;
  headline: string;
  dataWindow: string;
};

/**
 * Texto interno de una story. Instagram no muestra caption util en stories; se
 * rellena para que `createPost` tenga `text`, sin depender de el para leer la
 * imagen.
 */
export function buildStoryText(input: StoryTextInput): string {
  const slotLabel = STORY_SLOT_LABEL[input.slot];
  const text = [
    slotLabel,
    formatSocialDateLabel(input.dateKey),
    normalizeText(input.headline),
    input.dataWindow,
    'datosbizi.com',
  ].join(' · ');

  return clampText(text, SOCIAL_STORY_TEXT_MAX_LENGTH);
}

export type SocialAltTextInput = {
  kind: 'story' | 'carousel';
  slot: SocialSlot;
  dateKey: string;
  headline: string;
  facts?: readonly SocialStoryFact[];
  slides?: readonly Pick<SocialCarouselSlide, 'headline'>[];
  dataWindow?: string;
  cause?: { label: string } | null;
};

/**
 * Alt text descriptivo, sin hashtags ni CTA. Describe el formato, el titular,
 * los hechos y la ventana de datos para que la imagen tenga sentido sin verla.
 */
export function buildSocialAltText(input: SocialAltTextInput): string {
  const dateLabel = formatSocialDateLabel(input.dateKey);
  const format =
    input.kind === 'story'
      ? `Imagen vertical de la story del ${dateLabel}`
      : `Carrusel de ${input.slides?.length ?? 5} imágenes del ${dateLabel}`;

  const parts = [format, normalizeText(input.headline)];

  const facts = (input.facts ?? [])
    .slice(0, 3)
    .map((fact) => `${normalizeText(fact.label)}: ${normalizeText(fact.value)}`);
  if (facts.length > 0) {
    parts.push(facts.join('. '));
  }

  if (input.slides && input.slides.length > 0) {
    parts.push(input.slides.map((slide) => normalizeText(slide.headline)).join('. '));
  }

  if (input.dataWindow) {
    // Una hora suelta ("08:30") se lee "de las 08:30"; un rango ("17:00–18:30") no.
    const prefix = /^\d{1,2}:\d{2}$/u.test(input.dataWindow) ? 'las ' : '';
    parts.push(`Datos de ${prefix}${input.dataWindow}.`);
  }

  if (input.cause?.label) {
    parts.push(`Contexto: ${normalizeText(input.cause.label)}.`);
  }

  parts.push('Datos abiertos de Bizi Zaragoza, estimación de uso.');

  return clampText(parts.join(' '), SOCIAL_ALT_TEXT_MAX_LENGTH);
}

/** Etiqueta de disponibilidad con el vocabulario del producto. */
export function formatAvailabilityIssue(alertType: string | null | undefined): string {
  switch (alertType) {
    case 'LOW_BIKES':
      return 'Pocas bicis';
    case 'LOW_ANCHORS':
      return 'Pocos huecos';
    default:
      return 'Poca disponibilidad';
  }
}

/** "3 estaciones" / "1 estación" sin repetir la regla en cada constructor. */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** Horas sin bicis o sin huecos con su tasa, en lenguaje llano. */
export function formatFrictionFact(emptyHours: number, fullHours: number, totalHours: number): string {
  const frictionHours = Math.max(0, emptyHours) + Math.max(0, fullHours);
  const rate = totalHours > 0 ? frictionHours / totalHours : 0;

  return `${formatInteger(frictionHours)} h sin bicis o sin huecos · ${formatPercent(rate)} de las horas`;
}

/** Variacion porcentual con signo y sin inventar decimales. */
export function formatGrowthFact(ratio: number | null | undefined): string {
  return formatRatioDelta(ratio, 'sin comparación');
}

/** Magnitud de crecimiento para titulares ("sube un 12%"). */
export function formatGrowthMagnitude(ratio: number): string {
  return formatRatioMagnitude(ratio);
}

/** Etiqueta de la ventana de datos que se pinta en el kicker. */
export function buildDataWindowKicker(base: string, dataWindow: string): string {
  return `${base} · ${dataWindow}`;
}
