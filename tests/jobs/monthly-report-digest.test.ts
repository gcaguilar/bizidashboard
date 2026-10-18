import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  acquireJobLockMock,
  buildMonthlyReportMock,
  captureExceptionWithContextMock,
  captureWarningWithContextMock,
  isEmailConfiguredMock,
  sendEmailMock,
  storeMocks,
} = vi.hoisted(() => ({
  acquireJobLockMock: vi.fn(),
  buildMonthlyReportMock: vi.fn(),
  captureExceptionWithContextMock: vi.fn(),
  captureWarningWithContextMock: vi.fn(),
  isEmailConfiguredMock: vi.fn(),
  sendEmailMock: vi.fn(),
  storeMocks: {
    findByEmail: vi.fn(),
    findByConfirmToken: vi.fn(),
    findByUnsubscribeToken: vi.fn(),
    createPending: vi.fn(),
    resetToPending: vi.fn(),
    markConfirmed: vi.fn(),
    markUnsubscribed: vi.fn(),
    listConfirmed: vi.fn(),
    findDelivery: vi.fn(),
    claimDelivery: vi.fn(),
    markDeliverySent: vi.fn(),
    markDeliveryFailed: vi.fn(),
  },
}));

vi.mock('@/analytics/job-lock', () => ({
  acquireJobLock: acquireJobLockMock,
}));

vi.mock('@/lib/monthly-report', () => ({
  buildMonthlyReport: buildMonthlyReportMock,
}));

vi.mock('@/lib/email', () => ({
  isEmailConfigured: isEmailConfiguredMock,
  sendEmail: sendEmailMock,
}));

vi.mock('@/lib/report-subscription-store', () => ({
  reportSubscriptionStore: storeMocks,
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: captureExceptionWithContextMock,
  captureWarningWithContext: captureWarningWithContextMock,
}));

vi.mock('@sentry/tanstackstart-react', () => ({
  startSpan: <T>(_options: unknown, callback: () => T): T => callback(),
  withMonitor: <T>(_monitor: string, callback: () => T): T => callback(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  DIGEST_MONTHS,
  digestTargetMonths,
  runMonthlyReportDigest,
  sendMonthlyDigest,
  type MonthlyDigestDeps,
} from '@/jobs/monthly-report-digest';
import { createMemoryReportSubscriptionStore as createMemoryStore } from '@tests/helpers/report-subscription-memory-store';
import { buildMonthlyReportFixture } from '@tests/helpers/monthly-report-fixture';
import type { ReportSubscriptionRecord } from '@/lib/report-subscriptions';

function buildSubscription(
  overrides: Partial<ReportSubscriptionRecord> = {}
): ReportSubscriptionRecord {
  return {
    id: 'sub-1',
    email: 'ana@example.com',
    status: 'CONFIRMED',
    confirmToken: 'confirm-token',
    unsubscribeToken: 'unsubscribe-token',
    confirmedAt: new Date('2026-03-15T10:00:00.000Z'),
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    ...overrides,
  };
}

function buildDeps(
  store: MonthlyDigestDeps['store'],
  send: MonthlyDigestDeps['send']
): MonthlyDigestDeps {
  return {
    store,
    send,
    buildReport: vi.fn().mockResolvedValue(buildMonthlyReportFixture()),
    links: {
      reportUrl: (monthKey) => `https://datosbizi.com/informes/${monthKey}`,
      reportPdfUrl: (monthKey) =>
        `https://datosbizi.com/api/reports?month=${monthKey}&format=pdf`,
      unsubscribeUrl: (token) =>
        `https://datosbizi.com/api/reports/subscribe/unsubscribe?token=${token}`,
    },
    nowIso: '2026-04-01T05:30:00.000Z',
  };
}

describe('digestTargetMonths', () => {
  it('lista los meses cerrados más recientes, primero el que acaba de cerrar', () => {
    expect(digestTargetMonths('2026-04-15T10:00:00.000Z', 3)).toEqual([
      '2026-03',
      '2026-02',
      '2026-01',
    ]);
    expect(digestTargetMonths('2026-04-15T10:00:00.000Z', DIGEST_MONTHS)).toHaveLength(
      DIGEST_MONTHS
    );
  });
});

describe('sendMonthlyDigest', () => {
  const sendMock = vi.fn();

  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ ok: true, id: 'email-1' });
  });

  it('envía el informe solo a quien estaba confirmado al cerrar el mes', async () => {
    const { store, deliveries } = createMemoryStore([
      buildSubscription(),
      buildSubscription({
        id: 'sub-2',
        email: 'beto@example.com',
        unsubscribeToken: 'beto-unsub',
        confirmedAt: new Date('2026-04-02T10:00:00.000Z'), // confirmado tras cerrar marzo
      }),
      buildSubscription({ id: 'sub-3', email: 'carmen@example.com', status: 'PENDING', confirmedAt: null }),
    ]);

    const result = await sendMonthlyDigest('2026-03', buildDeps(store, sendMock));

    expect(result).toMatchObject({ monthKey: '2026-03', eligible: 1, sent: 1, failed: 0 });
    expect(sendMock).toHaveBeenCalledTimes(1);

    const message = sendMock.mock.calls[0][0];
    expect(message.to).toBe('ana@example.com');
    expect(message.subject).toContain('marzo de 2026');
    expect(message.idempotencyKey).toBe('report-digest-2026-03/sub-1');
    expect(message.html).toContain(
      'https://datosbizi.com/api/reports/subscribe/unsubscribe?token=unsubscribe-token'
    );
    expect(message.text).toContain('https://datosbizi.com/informes/2026-03');
    expect(message.text).toContain('https://datosbizi.com/api/reports?month=2026-03&format=pdf');

    const delivery = [...deliveries.values()][0];
    expect(delivery.status).toBe('SENT');
  });

  it('construye el informe una vez y lo reutiliza en todos los envíos', async () => {
    const { store } = createMemoryStore([
      buildSubscription(),
      buildSubscription({ id: 'sub-2', email: 'beto@example.com', unsubscribeToken: 'beto-unsub' }),
    ]);
    const deps = buildDeps(store, sendMock);

    await sendMonthlyDigest('2026-03', deps);

    expect(deps.buildReport).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('es idempotente: un mes ya enviado no se vuelve a mandar', async () => {
    const { store } = createMemoryStore([buildSubscription()]);
    const deps = buildDeps(store, sendMock);

    const first = await sendMonthlyDigest('2026-03', deps);
    const second = await sendMonthlyDigest('2026-03', deps);

    expect(first).toMatchObject({ sent: 1, skipped: 0 });
    expect(second).toMatchObject({ sent: 0, skipped: 1 });
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('reintenta un envío fallido y lo marca como enviado', async () => {
    const { store, deliveries } = createMemoryStore([buildSubscription()]);
    sendMock.mockResolvedValueOnce({ ok: false, reason: 'send_failed', message: 'boom' });

    const first = await sendMonthlyDigest('2026-03', buildDeps(store, sendMock));
    expect(first).toMatchObject({ sent: 0, failed: 1 });

    const failed = [...deliveries.values()][0];
    expect(failed.status).toBe('FAILED');
    expect(failed.attempts).toBe(1);

    const second = await sendMonthlyDigest('2026-03', buildDeps(store, sendMock));
    expect(second).toMatchObject({ sent: 1, failed: 0 });
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect([...deliveries.values()][0]).toMatchObject({ status: 'SENT', attempts: 2 });
  });

  it('no reintenta un envío que agotó sus intentos', async () => {
    const { store, deliveries } = createMemoryStore([buildSubscription()]);
    const deps = buildDeps(store, sendMock);

    for (const attempt of [1, 2, 3]) {
      sendMock.mockResolvedValueOnce({ ok: false, reason: 'send_failed', message: `boom ${attempt}` });
      await sendMonthlyDigest('2026-03', deps);
    }

    expect([...deliveries.values()][0].attempts).toBe(3);

    const after = await sendMonthlyDigest('2026-03', deps);
    expect(after).toMatchObject({ sent: 0, failed: 0, skipped: 1 });
    expect(sendMock).toHaveBeenCalledTimes(3);
  });

  it('no manda nada si el mes no tiene informe', async () => {
    const { store } = createMemoryStore([buildSubscription()]);
    const deps = buildDeps(store, sendMock);
    deps.buildReport = vi.fn().mockResolvedValue(buildMonthlyReportFixture({ hasReport: false }));

    const result = await sendMonthlyDigest('2026-03', deps);

    expect(result).toMatchObject({ eligible: 1, sent: 0, skipped: 1, reason: 'no_report' });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('no compone el informe si no hay suscriptores elegibles', async () => {
    const { store } = createMemoryStore([]);
    const deps = buildDeps(store, sendMock);

    const result = await sendMonthlyDigest('2026-03', deps);

    expect(result).toMatchObject({ eligible: 0, reason: 'no_subscribers' });
    expect(deps.buildReport).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sigue con el resto de suscriptores si uno falla', async () => {
    const { store } = createMemoryStore([
      buildSubscription(),
      buildSubscription({ id: 'sub-2', email: 'beto@example.com', unsubscribeToken: 'beto-unsub' }),
    ]);
    sendMock.mockImplementation(async (message: { to: string }) => {
      if (message.to === 'ana@example.com') {
        throw new Error('boom');
      }
      return { ok: true, id: 'email-2' };
    });

    const result = await sendMonthlyDigest('2026-03', buildDeps(store, sendMock));

    expect(result).toMatchObject({ sent: 1, failed: 1 });
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});

describe('runMonthlyReportDigest', () => {
  const releaseMock = vi.fn().mockResolvedValue(undefined);
  const refreshMock = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
    acquireJobLockMock.mockResolvedValue({ refresh: refreshMock, release: releaseMock });
    isEmailConfiguredMock.mockReturnValue(true);
    sendEmailMock.mockResolvedValue({ ok: true, id: 'email-1' });
    storeMocks.listConfirmed.mockResolvedValue([buildSubscription()]);
    storeMocks.findDelivery.mockResolvedValue(null);
    storeMocks.claimDelivery.mockImplementation(async (input) => ({
      id: `delivery-${input.subscriptionId}-${input.monthKey}`,
      subscriptionId: input.subscriptionId,
      monthKey: input.monthKey,
      status: 'PENDING',
      attempts: 1,
      claimedAt: input.claimedAt,
    }));
    storeMocks.markDeliverySent.mockResolvedValue(undefined);
    storeMocks.markDeliveryFailed.mockResolvedValue(undefined);
    buildMonthlyReportMock.mockResolvedValue(buildMonthlyReportFixture());
  });

  it('se salta el run si otro job ya tiene el lock', async () => {
    acquireJobLockMock.mockResolvedValue(null);

    await runMonthlyReportDigest();

    expect(storeMocks.listConfirmed).not.toHaveBeenCalled();
  });

  it('degrada sin enviar nada y avisa si el correo no está configurado', async () => {
    isEmailConfiguredMock.mockReturnValue(false);

    await runMonthlyReportDigest();

    expect(captureWarningWithContextMock).toHaveBeenCalledTimes(1);
    expect(storeMocks.listConfirmed).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });

  it('procesa los meses objetivo, envía y libera el lock', async () => {
    await runMonthlyReportDigest();

    expect(storeMocks.listConfirmed).toHaveBeenCalledTimes(DIGEST_MONTHS);
    expect(buildMonthlyReportMock).toHaveBeenCalledTimes(DIGEST_MONTHS);
    expect(sendEmailMock).toHaveBeenCalledTimes(DIGEST_MONTHS);
    expect(refreshMock).toHaveBeenCalledTimes(DIGEST_MONTHS);
    expect(releaseMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionWithContextMock).not.toHaveBeenCalled();
  });

  it('sigue con los demás meses si uno falla', async () => {
    buildMonthlyReportMock.mockRejectedValue(new Error('series unavailable'));

    await runMonthlyReportDigest();

    expect(buildMonthlyReportMock).toHaveBeenCalledTimes(DIGEST_MONTHS);
    expect(captureExceptionWithContextMock).toHaveBeenCalledTimes(DIGEST_MONTHS);
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });
});
