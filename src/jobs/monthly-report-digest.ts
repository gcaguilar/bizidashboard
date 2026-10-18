/**
 * Monthly report digest job
 *
 * Envía el informe del mes recién cerrado a las suscripciones confirmadas.
 * Corre cada día a las 05:30 UTC, justo después del sellado del informe
 * (05:00 UTC): el primer run del mes manda el correo y los runs siguientes
 * solo reintentan los envíos que fallaron, así que un run perdido o un fallo
 * parcial se recuperan sin duplicar correos (el control de envíos
 * `ReportDelivery` es por suscripción y mes, y cada envío lleva además la
 * clave de idempotencia de Resend).
 */

import { acquireJobLock } from '@/analytics/job-lock';
import { isEmailConfigured, sendEmail, type EmailMessage, type SendEmailResult } from '@/lib/email';
import { logger } from '@/lib/logger';
import { previousMonthKey } from '@/lib/months';
import { buildMonthlyReport, type MonthlyReport } from '@/lib/monthly-report';
import { buildMonthlyDigestEmail } from '@/lib/report-email';
import { reportSubscriptionStore } from '@/lib/report-subscription-store';
import {
  isEligibleForMonthDigest,
  resolveDeliveryAction,
  type ReportSubscriptionStore,
} from '@/lib/report-subscriptions';
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';
import {
  captureExceptionWithContext,
  captureWarningWithContext,
} from '@/lib/sentry-reporting';
import * as Sentry from '@sentry/tanstackstart-react';
import { defineCronJob } from './cron-job';
import { ensureLockRefreshed } from './utils';

/**
 * Meses que se procesan en cada run. El mes recién cerrado y el anterior:
 * cubre el caso de un run perdido al cambiar de mes sin llegar a mandar
 * correos viejos (la elegibilidad exige estar confirmado antes de que el mes
 * terminara).
 */
export const DIGEST_MONTHS = 2;

/** Meses cerrados más recientes, primero el que acaba de cerrar. */
export function digestTargetMonths(nowIso: string, count: number): string[] {
  const months: string[] = [];
  let cursor = previousMonthKey(nowIso.slice(0, 7));

  while (cursor && months.length < count) {
    months.push(cursor);
    cursor = previousMonthKey(cursor);
  }

  return months;
}

export type MonthlyDigestDeps = {
  store: ReportSubscriptionStore;
  send: (message: EmailMessage) => Promise<SendEmailResult>;
  buildReport: (monthKey: string, nowIso: string) => Promise<MonthlyReport>;
  links: {
    reportUrl: (monthKey: string) => string;
    reportPdfUrl: (monthKey: string) => string;
    unsubscribeUrl: (token: string) => string;
  };
  nowIso: string;
};

export type MonthlyDigestResult = {
  monthKey: string;
  eligible: number;
  sent: number;
  failed: number;
  skipped: number;
  reason?: 'no_report' | 'no_subscribers';
};

/**
 * Envía el informe de un mes a sus suscriptores. Idempotente: cada suscripción
 * reclama su envío (`claimDelivery`) antes de mandar y solo se salta los meses
 * ya enviados o los que agotaron sus reintentos.
 */
export async function sendMonthlyDigest(
  monthKey: string,
  deps: MonthlyDigestDeps
): Promise<MonthlyDigestResult> {
  const nowMs = Date.parse(deps.nowIso);
  const result: MonthlyDigestResult = {
    monthKey,
    eligible: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  const subscriptions = await deps.store.listConfirmed();
  const eligible = subscriptions.filter((subscription) =>
    isEligibleForMonthDigest(subscription, monthKey)
  );
  result.eligible = eligible.length;

  if (eligible.length === 0) {
    return { ...result, reason: 'no_subscribers' };
  }

  // Un informe se compone una vez y se reutiliza para todos los envíos.
  const report = await deps.buildReport(monthKey, deps.nowIso);
  if (!report.hasReport) {
    return { ...result, skipped: eligible.length, reason: 'no_report' };
  }

  for (const subscription of eligible) {
    try {
      const delivery = await deps.store.findDelivery(subscription.id, monthKey);
      if (resolveDeliveryAction(delivery, nowMs) === 'skip') {
        result.skipped += 1;
        continue;
      }

      const claimed = await deps.store.claimDelivery({
        subscriptionId: subscription.id,
        monthKey,
        claimedAt: new Date(deps.nowIso),
      });

      const message = buildMonthlyDigestEmail({
        report,
        reportUrl: deps.links.reportUrl(monthKey),
        pdfUrl: deps.links.reportPdfUrl(monthKey),
        unsubscribeUrl: deps.links.unsubscribeUrl(subscription.unsubscribeToken),
      });
      const sendResult = await deps.send({
        to: subscription.email,
        subject: message.subject,
        html: message.html,
        text: message.text,
        idempotencyKey: `report-digest-${monthKey}/${subscription.id}`,
        tags: [
          { name: 'category', value: 'report-digest' },
          { name: 'month', value: monthKey },
        ],
      });

      if (sendResult.ok) {
        await deps.store.markDeliverySent(claimed.id, sendResult.id, new Date(deps.nowIso));
        result.sent += 1;
      } else {
        await deps.store.markDeliveryFailed(claimed.id, sendResult.message);
        result.failed += 1;
        logger.warn('reports.digest_send_failed', {
          monthKey,
          subscriptionId: subscription.id,
          reason: sendResult.reason,
        });
      }
    } catch (error) {
      result.failed += 1;
      logger.warn('reports.digest_subscriber_failed', {
        monthKey,
        subscriptionId: subscription.id,
        error,
      });
    }
  }

  return result;
}

function createLiveDigestDeps(nowIso: string): MonthlyDigestDeps {
  return {
    store: reportSubscriptionStore,
    send: sendEmail,
    buildReport: buildMonthlyReport,
    links: {
      reportUrl: (monthKey) => toAbsoluteRouteUrl(appRoutes.reportMonth(monthKey)),
      reportPdfUrl: (monthKey) =>
        toAbsoluteRouteUrl(appRoutes.api.reports({ month: monthKey, format: 'pdf' })),
      unsubscribeUrl: (token) =>
        toAbsoluteRouteUrl(appRoutes.api.reportSubscribeUnsubscribe({ token })),
    },
    nowIso,
  };
}

export async function runMonthlyReportDigest(): Promise<void> {
  return Sentry.startSpan({ name: 'reports.digest', op: 'function' }, async () => {
    const lock = await acquireJobLock('monthly-report-digest');

    if (!lock) {
      logger.info('reports.digest_skipped_existing_lock');
      return;
    }

    const runStart = Date.now();

    try {
      // Sin configuración de correo no se crea ningún control de envío: al
      // llegar la configuración, los siguientes runs envían con normalidad.
      if (!isEmailConfigured()) {
        captureWarningWithContext(
          'Informe mensual: suscripciones sin enviar porque faltan RESEND_API_KEY o EMAIL_FROM.',
          { area: 'jobs.reports', operation: 'runMonthlyReportDigest' }
        );
        logger.warn('reports.digest_skipped_no_email_config');
        return;
      }

      const deps = createLiveDigestDeps(new Date().toISOString());

      for (const monthKey of digestTargetMonths(deps.nowIso, DIGEST_MONTHS)) {
        await ensureLockRefreshed(lock, `before-month-${monthKey}`, 'reports');

        try {
          const result = await sendMonthlyDigest(monthKey, deps);
          logger.info('reports.digest_month_finished', result);
        } catch (error) {
          captureExceptionWithContext(error, {
            area: 'jobs.reports',
            operation: 'sendMonthlyDigest',
            extra: { monthKey },
          });
          logger.warn('reports.digest_month_failed', { monthKey, error });
        }
      }
    } catch (error) {
      captureExceptionWithContext(error, {
        area: 'jobs.reports',
        operation: 'runMonthlyReportDigest',
      });
      logger.error('reports.digest_run_failed', { error });
    } finally {
      try {
        await lock.release();
      } catch (releaseError) {
        captureExceptionWithContext(releaseError, {
          area: 'jobs.reports',
          operation: 'release report digest lock',
        });
        logger.error('reports.digest_lock_release_failed', { error: releaseError });
      }

      logger.info('reports.digest_finished', { durationMs: Date.now() - runStart });
    }
  });
}

const monthlyReportDigestJob = defineCronJob({
  monitor: 'monthly-report-digest',
  logPrefix: 'reports.digest',
  schedule: '30 5 * * *',
  timezone: 'UTC',
  run: () => runMonthlyReportDigest(),
});

/** Start the monthly report digest job (daily at 05:30 UTC). */
export function startMonthlyReportDigestJob(): void {
  monthlyReportDigestJob.start();
}

/** Stop the monthly report digest job. */
export function stopMonthlyReportDigestJob(): void {
  monthlyReportDigestJob.stop();
}

/** Check if the monthly report digest job is currently scheduled. */
export function isMonthlyReportDigestScheduled(): boolean {
  return monthlyReportDigestJob.isScheduled();
}
