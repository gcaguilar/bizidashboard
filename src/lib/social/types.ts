/**
 * Tipos compartidos del agente social diario.
 *
 * Este modulo es puro y sin dependencias: lo consumen la configuracion, el
 * estado local, las agregaciones y, mas adelante, los constructores de stories,
 * copy, render y publicacion.
 */

export type SocialSlot = 'morning' | 'afternoon' | 'weekly' | 'monthly';

/**
 * Familia editorial del post. `slot` decide cuando se publica; `family` agrupa
 * el formato/contenido para la anti-repeticion y para auditar el estado.
 */
export type SocialFamily = 'daily-story' | 'weekly-carousel' | 'monthly-carousel';

export const SOCIAL_SLOTS: readonly SocialSlot[] = [
  'morning',
  'afternoon',
  'weekly',
  'monthly',
];

export const SOCIAL_SLOT_FAMILY: Record<SocialSlot, SocialFamily> = {
  morning: 'daily-story',
  afternoon: 'daily-story',
  weekly: 'weekly-carousel',
  monthly: 'monthly-carousel',
};

export type SocialStatus =
  | 'claimed'
  | 'rendering'
  | 'uploading'
  | 'publishing'
  | 'sent'
  | 'skipped'
  | 'error';

/** Estados en los que un proceso puede seguir trabajando el slot. */
export const SOCIAL_ACTIVE_STATUSES: readonly SocialStatus[] = [
  'claimed',
  'rendering',
  'uploading',
  'publishing',
];

/** Estados finales: no se reintentan ni se reclaman automaticamente. */
export const SOCIAL_TERMINAL_STATUSES: readonly SocialStatus[] = [
  'sent',
  'skipped',
  'error',
];

/** Par page/direct de una imagen alojada (tmpfiles en v1). */
export type SocialAsset = {
  pageUrl: string;
  directUrl: string;
};

export type SocialPostRecord = {
  id: number;
  dateKey: string;
  slot: SocialSlot;
  family: SocialFamily;
  status: SocialStatus;
  caption: string | null;
  altText: string | null;
  assetUrls: SocialAsset[];
  bufferPostId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

/** Campos que los distintos `mark...` pueden actualizar. */
export type SocialPostPatch = {
  caption?: string | null;
  altText?: string | null;
  assets?: readonly SocialAsset[];
  bufferPostId?: string | null;
  error?: string | null;
  publishedAt?: string | null;
};

export type SocialSlotMeta = {
  /** Por defecto se deriva de `SOCIAL_SLOT_FAMILY`. */
  family?: SocialFamily;
  caption?: string | null;
  altText?: string | null;
};

export type SocialClaimOutcome =
  | {
      claimed: true;
      record: SocialPostRecord;
      /** `true` si la fila existia y se recupero por estar obsoleta. */
      reclaimed: boolean;
    }
  | {
      claimed: false;
      record: SocialPostRecord;
      /**
       * `stale_publishing` exige revision manual: el proceso pudo morir despues
       * de que Buffer aceptase el post y antes de marcarlo como enviado.
       */
      reason: 'in_progress' | 'terminal' | 'stale_publishing';
    };

export type SocialStoryFact = {
  label: string;
  value: string;
};

/** Barra simple del render (actividad por distrito, horas de friccion...). */
export type SocialBar = {
  label: string;
  value: number;
};

/**
 * Story lista para renderizar. El texto final vive en `copy.ts` (paso 2); aqui
 * solo se fija la forma que comparten los cuatro slots.
 *
 * `kicker`, `accent` y `bars` son opcionales para no romper el contrato previo:
 * los constructores del paso 2 los rellenan, pero un consumidor antiguo puede
 * seguir creando una story solo con los campos obligatorios.
 */
export type SocialStory = {
  slot: SocialSlot;
  family: SocialFamily;
  dateKey: string;
  headline: string;
  facts: readonly SocialStoryFact[];
  footer: string;
  caption: string;
  altText: string;
  /** Texto pequeno sobre el titular, p. ej. "Mañana en bici · 07:00–08:30". */
  kicker?: string;
  /** Color de acento `#rrggbb`; el render valida el formato. */
  accent?: string;
  /** Barras simples que acompasan los hechos cuando hay datos. */
  bars?: readonly SocialBar[];
  /** Titulo de la grafica de barras, p. ej. "Uso estimado por distrito". */
  barsLabel?: string;
};

/** Una lamina del carrusel de Instagram (1080x1350). */
export type SocialCarouselSlide = {
  kicker: string;
  headline: string;
  facts: readonly SocialStoryFact[];
  footer: string;
  accent: string;
  bars?: readonly SocialBar[];
  barsLabel?: string;
};

/** Carrusel completo de 5 laminas para weekly/monthly. */
export type SocialCarousel = {
  slot: Extract<SocialSlot, 'weekly' | 'monthly'>;
  family: Extract<SocialFamily, 'weekly-carousel' | 'monthly-carousel'>;
  dateKey: string;
  headline: string;
  facts: readonly SocialStoryFact[];
  footer: string;
  caption: string;
  altText: string;
  slides: readonly SocialCarouselSlide[];
};

/** Contexto de red ya calculado por `buildNetworkHealth`/`getNetworkBalanceSummary`. */
export type SocialNetworkContext = {
  level: 'green' | 'yellow' | 'red' | 'unknown';
  label: string;
  description?: string;
  criticalStationsCount: number;
  totalStations: number;
  unavailableShare?: number;
};

/** Causa curada (`getServiceCause`); solo se menciona si el llamante la aporta. */
export type SocialCause = {
  label: string;
  kind?: string;
};

export type SocialRunTrigger = 'schedule' | 'preview';

export type SocialRunContext = {
  slot: SocialSlot;
  family: SocialFamily;
  dateKey: string;
  nowIso: string;
  timezone: string;
  city: string;
  dryRun: boolean;
  trigger: SocialRunTrigger;
};

export type SocialPeriodRange = {
  startDateKey: string;
  endDateKey: string;
  /** Inicio local convertido a ISO UTC. */
  startIso: string;
  /** Siguiente inicio, exclusivo, convertido a ISO UTC. */
  endExclusiveIso: string;
};

export type SocialWeekRange = {
  /** Lunes de la semana. */
  weekStart: string;
  /** Domingo de la semana. */
  weekEnd: string;
  /** Lunes 00:00 local convertido a ISO UTC. */
  startIso: string;
  /** Lunes siguiente 00:00 local convertido a ISO UTC, exclusivo. */
  endExclusiveIso: string;
};

/** Fila de demanda/actividad por estacion antes de agregar por distrito. */
export type SocialDistrictDemandRow = {
  stationId: string;
  district?: string | null;
  activityIndex: number;
};

/** Friccion (horas vacia/llena) por estacion antes de agregar por distrito. */
export type SocialDistrictFrictionRow = {
  stationId: string;
  district?: string | null;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
};

export type SocialDistrictStats = {
  district: string;
  stationCount: number;
  activityIndex: number;
  previousActivityIndex: number;
  growthRatio: number | null;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
  frictionRate: number;
};

/** Estacion con los campos minimos que comparten el snapshot y el estado ciudadano. */
export type SocialStationCandidate = {
  id: string;
  name: string;
  capacity: number;
  bikesAvailable: number;
  anchorsFree: number;
};

/**
 * Estacion cercana para sugerir a quien encuentra la suya vacia (`bikes`: con
 * bicis para coger) o llena (`anchors`: con huecos para dejar la bici).
 */
export type SocialNearbyAlternative = {
  fromStationId: string;
  name: string;
  kind: 'bikes' | 'anchors';
  /** Distancia en linea recta, redondeada a 10 m. */
  distanceMeters: number;
  /** Bicis (`bikes`) o huecos libres (`anchors`) disponibles ahora. */
  available: number;
};

export type SocialMorningStationProfile = {
  stationId: string;
  /** Proporcion de horas agregadas con `bikesMax <= 0`. */
  emptyShare: number;
  sampleCount?: number;
};

/** `empty`: sin bicis (manana). `full`: sin huecos (tarde). `low`: quedan pocas. */
export type SocialStationSelectionMode = 'empty' | 'full' | 'low' | 'none';

/** Perfil de tarde (17-19 h, dias laborables): cuanto suele estar sin huecos. */
export type SocialEveningStationProfile = {
  stationId: string;
  /** Proporcion de horas agregadas con `anchorsMax <= 0`. */
  fullShare: number;
  sampleCount?: number;
};

export type SocialStationSelection<T extends SocialStationCandidate> = {
  mode: SocialStationSelectionMode;
  stations: T[];
};
