/**
 * Cron job lifecycle
 *
 * Owns the schedule, Sentry cron monitor, start/stop/shutdown lifecycle, and
 * logging that every scheduled job shares. A job supplies a monitor slug, a
 * log prefix, a crontab expression, and the body to run — nothing else.
 *
 * The lock (`analytics/job-lock`) is deliberately NOT owned here: a job's lock
 * scope is part of its body (it must wrap the work, not just the tick).
 */

import { schedule } from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import * as Sentry from '@sentry/tanstackstart-react';
import { logger } from '@/lib/logger';
import type { CronOptions } from './types';

export type CronJobDefinition = {
  /** Sentry monitor slug (e.g. `bizi-collection`). */
  monitor: string;
  /** Log-message prefix (e.g. `collection`, `analytics`). */
  logPrefix: string;
  /** Crontab expression. */
  schedule: string;
  /** IANA timezone for the schedule (e.g. `Europe/Madrid`, `UTC`). */
  timezone: string;
  /** Run once immediately on start (default true). */
  runOnInit?: boolean;
  /** The body executed on every tick, wrapped in a Sentry cron monitor. */
  run: () => Promise<void>;
};

export type CronJob = {
  start: () => void;
  stop: () => void;
  isScheduled: () => boolean;
};

export function defineCronJob(definition: CronJobDefinition): CronJob {
  const { monitor, logPrefix, schedule: expression, timezone, runOnInit = true, run } = definition;
  let task: ScheduledTask | null = null;

  const start = () => {
    if (task) {
      logger.info(`${logPrefix}.cron_already_running`);
      return;
    }

    task = schedule(
      expression,
      async () => {
        try {
          await Sentry.withMonitor(
            monitor,
            () => run(),
            {
              schedule: { type: 'crontab', value: expression },
              timezone,
            }
          );
        } catch (error) {
          // run() handles its own errors; this only prevents the process crashing.
          logger.error(`${logPrefix}.cron_failed`, { error });
        }
      },
      {
        scheduled: true,
        timezone,
        runOnInit,
      } as CronOptions
    );

    logger.info(`${logPrefix}.cron_started`, { schedule: expression });
  };

  const stop = () => {
    if (task) {
      void task.stop();
      task = null;
      logger.info(`${logPrefix}.cron_stopped`);
    }
  };

  const isScheduled = () => task !== null;

  return { start, stop, isScheduled };
}
