/**
 * Proceso standalone del agente social.
 *
 * Registra los cinco cron jobs (manana, mediodia, tarde, semanal, mensual) en su propio
 * contenedor/proceso. Deliberadamente no arranca la recoleccion GBFS ni la
 * agregacion de analitica: esas viven en `src/jobs/standalone.ts`.
 *
 * El estado operativo es un SQLite local (`SOCIAL_STATE_DB`); Postgres solo se
 * lee. Al arrancar se recupera un slot vencido dentro de la ventana de catch-up
 * usando `claimSlot` como guarda, para no publicar dos veces.
 */

import '@/instrument.server';

import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { createBufferClient, type BufferClient } from '@/lib/social/buffer';
import {
  getSocialConfig,
  validateSocialRuntimeConfig,
  type SocialConfig,
} from '@/lib/social/config';
import {
  getSlotDateKey,
  SOCIAL_SLOT_SCHEDULE,
} from '@/lib/social/data';
import { createMediaHost, type MediaHost } from '@/lib/social/media';
import { renderSocialContent } from '@/lib/social/render';
import {
  createBunSqliteStateStore,
  type StateStore,
} from '@/lib/social/state';
import {
  SOCIAL_SLOTS,
  type SocialCarousel,
  type SocialSlot,
  type SocialStory,
} from '@/lib/social/types';

import { defineCronJob, type CronJob } from '@/jobs/cron-job';
import { runAfternoonSlot } from './social/afternoon';
import { runFeatureSlot } from './social/feature';
import { runMiddaySlot } from './social/midday';
import { runMonthlySlot } from './social/monthly';
import { runMorningSlot } from './social/morning';
import {
  SOCIAL_RECENT_CONTENT_LIMIT,
  shouldRunCatchup,
  runSocialSlot,
  toSocialErrorMessage,
  type SocialSlotDataDeps,
} from './social/shared';
import { runWeeklySlot } from './social/weekly';

type SocialRuntime = {
  state: StateStore;
  media: MediaHost;
  buffer: BufferClient;
};

type SocialSlotBuild = () => Promise<SocialStory | SocialCarousel | null>;

let runtime: SocialRuntime | null = null;
let cronJobs: CronJob[] = [];
let started = false;
let shuttingDown = false;

function createSlotBuild(
  slot: SocialSlot,
  deps: SocialSlotDataDeps
): SocialSlotBuild {
  return async () => {
    switch (slot) {
      case 'morning':
        return runMorningSlot(deps);
      case 'midday':
        return runMiddaySlot(deps);
      case 'afternoon':
        return runAfternoonSlot(deps);
      case 'feature':
        return runFeatureSlot(deps);
      case 'weekly':
        return runWeeklySlot(deps);
      case 'monthly':
        return runMonthlySlot(deps);
      default:
        return null;
    }
  };
}

async function executeSlot(slot: SocialSlot, now: Date, config: SocialConfig): Promise<void> {
  const active = runtime;
  if (!active) {
    logger.warn('social.slot_ignored', { slot, reason: 'runtime_not_started' });
    return;
  }

  const dateKey = getSlotDateKey(slot, now, config.timezone);
  const deps: SocialSlotDataDeps = {
    now,
    config,
    recentContent: (query) =>
      active.state.getRecentContent(
        query?.limit ?? SOCIAL_RECENT_CONTENT_LIMIT,
        query?.family
      ),
  };

  await runSocialSlot({
    slot,
    dateKey,
    now,
    config,
    state: active.state,
    media: active.media,
    buffer: active.buffer,
    build: createSlotBuild(slot, deps),
    render: renderSocialContent,
  });
}

/**
 * Recupera como maximo una ejecucion por slot si el arranque cae dentro de la
 * ventana de catch-up y el registro no es terminal. Un slot semanal/mensual ya
 * enviado o descartado esta identificado por su lunes/mes y no se repite.
 */
async function runCatchUp(config: SocialConfig, now: Date): Promise<void> {
  const active = runtime;
  if (!active) {
    return;
  }

  for (const slot of SOCIAL_SLOTS) {
    const dateKey = getSlotDateKey(slot, now, config.timezone);

    try {
      const record = await active.state.getBySlot(dateKey, slot);
      if (
        !shouldRunCatchup({
          slot,
          now,
          catchupMinutes: config.catchupMinutes,
          timezone: config.timezone,
          record,
        })
      ) {
        continue;
      }

      logger.info('social.catchup_started', { slot, dateKey });
      await executeSlot(slot, now, config);
      logger.info('social.catchup_finished', { slot, dateKey });
    } catch (error) {
      // `runSocialSlot` ya marco el error y lo envio a Sentry. El catch-up no
      // debe impedir que arranquen los demas slots ni el proceso.
      logger.warn('social.catchup_failed', {
        slot,
        dateKey,
        error: toSocialErrorMessage(error),
      });
    }
  }
}

export async function startSocialJobs(): Promise<void> {
  if (started) {
    return;
  }

  const config = getSocialConfig();

  if (!config.enabled) {
    logger.info('social.disabled');
    return;
  }

  validateSocialRuntimeConfig(config);

  if (!config.dryRun && (!config.bufferApiKey || !config.bufferChannelId)) {
    throw new Error(
      'SOCIAL_ENABLED requires BUFFER_API_KEY and BUFFER_CHANNEL_ID (or SOCIAL_DRY_RUN=1)'
    );
  }

  const state = await createBunSqliteStateStore(config.stateDbPath);
  runtime = {
    state,
    media: createMediaHost(config),
    buffer: createBufferClient(config),
  };

  cronJobs = SOCIAL_SLOTS.map((slot) =>
    defineCronJob({
      monitor: `social-${slot}`,
      logPrefix: `social.${slot}`,
      schedule: SOCIAL_SLOT_SCHEDULE[slot].cron,
      timezone: config.timezone,
      runOnInit: false,
      run: async () => {
        await executeSlot(slot, new Date(), getSocialConfig());
      },
    })
  );

  for (const job of cronJobs) {
    job.start();
  }

  started = true;
  logger.info('social.jobs_started', {
    timezone: config.timezone,
    dryRun: config.dryRun,
    slots: SOCIAL_SLOTS,
  });

  await runCatchUp(config, new Date());
}

export async function stopSocialJobs(): Promise<void> {
  for (const job of cronJobs) {
    job.stop();
  }
  cronJobs = [];

  const active = runtime;
  runtime = null;
  started = false;

  if (active) {
    try {
      await active.state.close();
    } catch (error) {
      logger.error('social.state_close_failed', {
        error: toSocialErrorMessage(error),
      });
    }
  }
}

function shutdown(signal: string): void {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info('social.shutting_down', { signal });

  void stopSocialJobs().finally(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

void startSocialJobs().catch((error) => {
  captureExceptionWithContext(error, {
    area: 'jobs.social',
    operation: 'start',
  });
  logger.error('social.start_failed', {
    error: toSocialErrorMessage(error),
  });
  process.exit(1);
});
