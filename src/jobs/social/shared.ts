/**
 * Runner comun de los cuatro slots sociales.
 *
 * El wrapper es el unico sitio que habla con el estado, el host de imagenes y
 * Buffer. Los adaptadores de datos (`morning`, `afternoon`, `weekly`,
 * `monthly`) solo construyen contenido; el render llega inyectado para que los
 * tests no dependan de Resvg.
 *
 * Un fallo nunca se reintenta aqui: se marca `error`, se reporta a Sentry y se
 * relanza para que el cron monitor lo vea. El estado decide si un slot puede
 * volver a ejecutarse (`claimSlot`); una fila atascada en `publishing` no se
 * reclama nunca, porque Buffer pudo aceptar ya el post.
 */

import type { SocialConfig } from '@/lib/social/config';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { normalizeDistrictName, isSocialSlotDue } from '@/lib/social/data';
import type { BufferClient } from '@/lib/social/buffer';
import type { MediaHost } from '@/lib/social/media';
import type { StateStore } from '@/lib/social/state';
import {
  SOCIAL_TERMINAL_STATUSES,
  type SocialCarousel,
  type SocialClaimOutcome,
  type SocialContentMetadata,
  type SocialFamily,
  type SocialPostRecord,
  type SocialSlot,
  type SocialStory,
} from '@/lib/social/types';

const MAX_ERROR_LENGTH = 500;
const STORY_ASSET_COUNT = 1;

/** Cuantas piezas recientes mira la rotacion de estaciones (~7 dias a 6 slots). */
export const SOCIAL_RECENT_CONTENT_LIMIT = 42;

/** Cuantos semanales se recuerdan para no repetir barrio del dia. */
const SOCIAL_SPOTLIGHT_HISTORY_LIMIT = 6;

export type SocialRecentContentQuery = {
  limit?: number;
  family?: SocialFamily;
};

export type SocialSlotContent = SocialStory | SocialCarousel;

export type SocialSlotDataDeps = {
  now: Date;
  /** Solo se necesita la zona horaria para calcular claves y ventanas. */
  config: Pick<SocialConfig, 'timezone'>;
  /**
   * Metadata de las ultimas piezas publicadas. Opcional: el preview local no
   * abre SQLite y entonces la rotacion simplemente no tiene historial.
   */
  recentContent?: (
    query?: SocialRecentContentQuery
  ) => Promise<readonly SocialContentMetadata[]>;
};

/**
 * IDs de estacion que aparecieron en las ultimas piezas, sin duplicados y
 * limitados a `SOCIAL_RECENT_CONTENT_LIMIT` piezas. Es la senal de recencia que
 * consumen los selectores; nunca sustituye a la gravedad actual.
 */
export async function getRecentStationIds(
  deps: Pick<SocialSlotDataDeps, 'recentContent'>
): Promise<string[]> {
  if (!deps.recentContent) {
    return [];
  }

  const recent = await deps.recentContent({ limit: SOCIAL_RECENT_CONTENT_LIMIT });
  const ids = new Set<string>();
  for (const metadata of recent) {
    for (const stationId of metadata.stationIds ?? []) {
      if (stationId.trim()) {
        ids.add(stationId);
      }
    }
  }

  return Array.from(ids);
}

/**
 * Barrios destacados en las ultimas piezas, sin duplicados y de mas reciente a
 * mas antiguo. Solo mira `spotlightDistrict`: los distritos que aparecen en un
 * ranking no cuentan como barrio del dia.
 */
export async function getRecentSpotlightDistricts(
  deps: Pick<SocialSlotDataDeps, 'recentContent'>
): Promise<string[]> {
  if (!deps.recentContent) {
    return [];
  }

  const recent = await deps.recentContent({
    limit: SOCIAL_SPOTLIGHT_HISTORY_LIMIT,
    family: 'weekly-carousel',
  });
  const names: string[] = [];
  const seen = new Set<string>();
  for (const metadata of recent) {
    const name = metadata.spotlightDistrict?.trim();
    if (!name) {
      continue;
    }
    const key = normalizeDistrictName(name);
    if (!seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  }

  return names;
}

export type RunSocialSlotInput = {
  slot: SocialSlot;
  dateKey: string;
  now: Date;
  config: SocialConfig;
  state: StateStore;
  media: MediaHost;
  buffer: BufferClient;
  /** Construye el contenido del slot; `null` significa datos insuficientes. */
  build: () => Promise<SocialSlotContent | null>;
  /** Render inyectado: story -> 1 JPEG; carrusel -> 1 JPEG por lamina. */
  render: (content: SocialSlotContent) => readonly Uint8Array[];
};

function isCarousel(content: SocialSlotContent): content is SocialCarousel {
  return 'slides' in content;
}

/** Mensaje corto y seguro para el estado y los logs. */
export function toSocialErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown social slot error';
  const normalized = raw.trim() || 'Unknown social slot error';
  const codePoints = Array.from(normalized);

  return codePoints.length > MAX_ERROR_LENGTH
    ? `${codePoints.slice(0, MAX_ERROR_LENGTH).join('')}…`
    : normalized;
}

/**
 * Decide si el arranque debe recuperar un slot vencido: tiene que estar dentro
 * de la ventana de catch-up y no existir un registro terminal. El `claimSlot`
 * sigue siendo la guarda final contra dos procesos simultaneos.
 */
export function shouldRunCatchup(input: {
  slot: SocialSlot;
  now: Date;
  catchupMinutes: number;
  timezone: string;
  record: Pick<SocialPostRecord, 'status'> | null;
}): boolean {
  if (!isSocialSlotDue(input.slot, input.now, input.catchupMinutes, input.timezone)) {
    return false;
  }

  if (!input.record) {
    return true;
  }

  return !SOCIAL_TERMINAL_STATUSES.includes(input.record.status);
}

function expectedAssetCount(content: SocialSlotContent): number {
  // Un carrusel puede crecer (barrio del dia); el contrato es una imagen por lamina.
  return isCarousel(content) ? content.slides.length : STORY_ASSET_COUNT;
}

function assertRenderedImages(
  content: SocialSlotContent,
  images: readonly Uint8Array[]
): void {
  const expected = expectedAssetCount(content);
  if (images.length !== expected) {
    throw new Error(
      `Social ${isCarousel(content) ? 'carousel' : 'story'} rendered ${images.length} image(s), expected ${expected}`
    );
  }

  if (images.some((image) => !(image instanceof Uint8Array) || image.length === 0)) {
    throw new Error('Social render produced an empty image');
  }
}

function assetBaseName(slot: SocialSlot, dateKey: string): string {
  return `social-${slot}-${dateKey.replace(/[^0-9a-z-]/giu, '-')}`;
}

/**
 * Ejecuta un slot de principio a fin. Devuelve sin lanzar cuando el estado
 * rechaza el claim o cuando no hay datos; lanza en cualquier fallo real para
 * que el monitor de cron y Sentry lo registren.
 */
export async function runSocialSlot(input: RunSocialSlotInput): Promise<void> {
  const { slot, dateKey } = input;
  let claim: SocialClaimOutcome;

  try {
    claim = await input.state.claimSlot(dateKey, slot);
  } catch (error) {
    // Un fallo del estado local (SQLite corrupto, volumen lleno...) tambien
    // debe llegar a Sentry; el cron monitor solo veria el rechazo.
    captureExceptionWithContext(error, {
      area: 'jobs.social',
      operation: slot,
      extra: { dateKey, slot, stage: 'claim' },
    });
    throw error;
  }

  if (!claim.claimed) {
    if (claim.reason === 'stale_publishing') {
      // El proceso pudo morir despues de que Buffer aceptase el post y antes de
      // `markSent`. Republicar podria duplicarlo: la fila queda intacta y exige
      // revision manual antes de marcarla como enviada o error.
      const error = new Error(
        `Stale social publishing record (${slot}/${dateKey}, id ${claim.record.id}) requires manual review: Buffer may have accepted the post`
      );
      logger.error('social.stale_publishing_requires_review', {
        slot,
        dateKey,
        recordId: claim.record.id,
        bufferPostId: claim.record.bufferPostId,
        updatedAt: claim.record.updatedAt,
      });
      captureExceptionWithContext(error, {
        area: 'jobs.social',
        operation: slot,
        extra: {
          slot,
          dateKey,
          recordId: claim.record.id,
          bufferPostId: claim.record.bufferPostId,
          updatedAt: claim.record.updatedAt,
        },
      });
      return;
    }

    logger.info('social.slot_skipped', {
      slot,
      dateKey,
      reason: claim.reason,
      status: claim.record.status,
    });
    return;
  }

  const id = claim.record.id;
  logger.info('social.slot_claimed', { slot, dateKey, reclaimed: claim.reclaimed });

  try {
    await input.state.markRendering(id);

    const content = await input.build();
    if (!content) {
      await input.state.markSkipped(id, { error: 'insufficient_data' });
      // Un skip por datos insuficientes es una alerta operativa: el slot del
      // dia no se ha publicado. Sentry es el unico canal configurado.
      captureExceptionWithContext(
        new Error(`Social slot ${slot}/${dateKey} skipped: insufficient data`),
        {
          area: 'jobs.social',
          operation: slot,
          extra: { dateKey, slot, reason: 'insufficient_data' },
        }
      );
      logger.info('social.slot_skipped', {
        slot,
        dateKey,
        reason: 'insufficient_data',
      });
      return;
    }

    const carousel = isCarousel(content);

    if (input.config.dryRun) {
      await input.state.markSkipped(id, {
        caption: content.caption,
        altText: content.altText,
        error: 'dry_run',
      });
      logger.info('social.slot_dry_run', {
        slot,
        dateKey,
        headline: content.headline,
        caption: content.caption,
      });
      return;
    }

    const images = input.render(content);
    assertRenderedImages(content, images);

    await input.state.markUploading(id, {
      caption: content.caption,
      altText: content.altText,
    });

    const assets = await input.media.uploadMany(
      images,
      assetBaseName(slot, dateKey)
    );
    if (assets.length !== images.length) {
      throw new Error(
        `Social media host returned ${assets.length} asset(s) for ${images.length} image(s)`
      );
    }

    await input.state.markPublishing(id, {
      caption: content.caption,
      altText: content.altText,
      assets,
    });

    const result = await input.buffer.createPost({
      text: content.caption,
      assets,
      format: carousel ? 'carousel' : 'story',
      shouldShareToFeed: carousel,
      altText: content.altText,
      channelId: input.config.bufferChannelId ?? undefined,
    });

    await input.state.markSent(id, {
      bufferPostId: result.id,
      metadata: content.metadata,
    });
    logger.info('social.slot_sent', {
      slot,
      dateKey,
      bufferPostId: result.id,
      bufferStatus: result.status,
      assets: assets.length,
    });
  } catch (error) {
    const message = toSocialErrorMessage(error);

    try {
      await input.state.markError(id, { error: message });
    } catch (stateError) {
      logger.error('social.slot_error_state_failed', {
        slot,
        dateKey,
        error: toSocialErrorMessage(stateError),
      });
    }

    captureExceptionWithContext(error, {
      area: 'jobs.social',
      operation: slot,
      extra: { dateKey, slot },
    });
    logger.error('social.slot_failed', { slot, dateKey, error: message });

    throw error;
  }
}
