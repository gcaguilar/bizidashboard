import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createMemoryReportSubscriptionStore as createMemoryStore } from '@tests/helpers/report-subscription-memory-store';
import {
  DIGEST_MAX_ATTEMPTS,
  DIGEST_STALE_CLAIM_MS,
  confirmSubscription,
  isEligibleForMonthDigest,
  isValidSubscriptionEmail,
  normalizeSubscriptionEmail,
  requestReportSubscription,
  resolveDeliveryAction,
  unsubscribeSubscription,
  type ReportSubscriptionRecord,
} from '@/lib/report-subscriptions';

function buildRecord(
  overrides: Partial<ReportSubscriptionRecord> = {}
): ReportSubscriptionRecord {
  return {
    id: 'sub-1',
    email: 'ana@example.com',
    status: 'PENDING',
    confirmToken: 'confirm-token',
    unsubscribeToken: 'unsubscribe-token',
    confirmedAt: null,
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    ...overrides,
  };
}

const confirmUrl = (token: string) => `https://datosbizi.com/api/reports/subscribe/confirm?token=${token}`;

describe('validación de correo de suscripción', () => {
  it('normaliza el correo antes de usarlo', () => {
    expect(normalizeSubscriptionEmail('  Ana@Example.COM ')).toBe('ana@example.com');
  });

  it('acepta correos válidos y rechaza los inválidos', () => {
    expect(isValidSubscriptionEmail('ana@example.com')).toBe(true);
    expect(isValidSubscriptionEmail('ana+informes@sub.example.es')).toBe(true);
    expect(isValidSubscriptionEmail('ana@@example.com')).toBe(false);
    expect(isValidSubscriptionEmail('ana@example')).toBe(false);
    expect(isValidSubscriptionEmail('ana..pedro@example.com')).toBe(false);
    expect(isValidSubscriptionEmail('')).toBe(false);
    expect(isValidSubscriptionEmail(`${'a'.repeat(250)}@example.com`)).toBe(false);
  });
});

describe('requestReportSubscription', () => {
  const sendMock = vi.fn();

  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ ok: true, id: 'resend-1' });
  });

  it('crea una suscripción pendiente y envía el correo de confirmación', async () => {
    const { store, subscriptions } = createMemoryStore();

    const result = await requestReportSubscription('Ana@Example.com', {
      store,
      send: sendMock,
      confirmUrl,
      nowIso: '2026-03-01T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'pending' });
    const record = [...subscriptions.values()][0];
    expect(record.email).toBe('ana@example.com');
    expect(record.status).toBe('PENDING');
    expect(record.confirmedAt).toBeNull();

    expect(sendMock).toHaveBeenCalledTimes(1);
    const message = sendMock.mock.calls[0][0];
    expect(message.to).toBe('ana@example.com');
    expect(message.subject).toContain('Confirma tu suscripción');
    expect(message.text).toContain(confirmUrl(record.confirmToken));
    expect(message.html).toContain(confirmUrl(record.confirmToken));
    expect(message.idempotencyKey).toBe(`report-confirm/${record.id}`);
  });

  it('no crea nada si el correo no es válido', async () => {
    const { store, subscriptions } = createMemoryStore();

    const result = await requestReportSubscription('no-es-un-correo', {
      store,
      send: sendMock,
      confirmUrl,
      nowIso: '2026-03-01T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'invalid' });
    expect(subscriptions.size).toBe(0);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('devuelve already_confirmed sin enviar correo si ya estaba confirmada', async () => {
    const { store, subscriptions } = createMemoryStore([
      buildRecord({ status: 'CONFIRMED', confirmedAt: new Date('2026-02-01T10:00:00.000Z') }),
    ]);

    const result = await requestReportSubscription('ana@example.com', {
      store,
      send: sendMock,
      confirmUrl,
      nowIso: '2026-03-01T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'already_confirmed' });
    expect(subscriptions.size).toBe(1);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('regenera los tokens al repetir la petición sobre una suscripción pendiente', async () => {
    const { store, subscriptions } = createMemoryStore([buildRecord()]);

    await requestReportSubscription('ana@example.com', {
      store,
      send: sendMock,
      confirmUrl,
      nowIso: '2026-03-01T10:00:00.000Z',
    });

    const record = [...subscriptions.values()][0];
    expect(subscriptions.size).toBe(1);
    expect(record.status).toBe('PENDING');
    expect(record.confirmToken).not.toBe('confirm-token');
    expect(record.unsubscribeToken).not.toBe('unsubscribe-token');
  });

  it('reactiva como pendiente una suscripción dada de baja', async () => {
    const { store, subscriptions } = createMemoryStore([buildRecord({ status: 'UNSUBSCRIBED' })]);

    const result = await requestReportSubscription('ana@example.com', {
      store,
      send: sendMock,
      confirmUrl,
      nowIso: '2026-03-01T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'pending' });
    const record = [...subscriptions.values()][0];
    expect(record.status).toBe('PENDING');
    expect(record.confirmedAt).toBeNull();
  });

  it('avisa como unavailable si el correo de confirmación no se puede enviar', async () => {
    const { store } = createMemoryStore();
    sendMock.mockResolvedValue({ ok: false, reason: 'send_failed', message: 'boom' });

    const result = await requestReportSubscription('ana@example.com', {
      store,
      send: sendMock,
      confirmUrl,
      nowIso: '2026-03-01T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'unavailable' });
  });
});

describe('confirmSubscription', () => {
  it('confirma una suscripción pendiente una sola vez', async () => {
    const { store, subscriptions } = createMemoryStore([buildRecord()]);

    const first = await confirmSubscription({
      store,
      token: 'confirm-token',
      nowIso: '2026-03-02T10:00:00.000Z',
    });
    const second = await confirmSubscription({
      store,
      token: 'confirm-token',
      nowIso: '2026-03-03T10:00:00.000Z',
    });

    expect(first).toEqual({ status: 'confirmed' });
    expect(second).toEqual({ status: 'already_confirmed' });

    const record = [...subscriptions.values()][0];
    expect(record.status).toBe('CONFIRMED');
    expect(record.confirmedAt?.toISOString()).toBe('2026-03-02T10:00:00.000Z');
  });

  it('rechaza tokens desconocidos o vacíos', async () => {
    const { store } = createMemoryStore([buildRecord()]);

    await expect(confirmSubscription({ store, token: '', nowIso: '2026-03-02T10:00:00.000Z' })).resolves.toEqual({
      status: 'invalid',
    });
    await expect(
      confirmSubscription({ store, token: 'otro-token', nowIso: '2026-03-02T10:00:00.000Z' })
    ).resolves.toEqual({ status: 'invalid' });
  });

  it('no reactiva una suscripción dada de baja desde un enlace antiguo', async () => {
    const { store, subscriptions } = createMemoryStore([buildRecord({ status: 'UNSUBSCRIBED' })]);

    const result = await confirmSubscription({
      store,
      token: 'confirm-token',
      nowIso: '2026-03-02T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'invalid' });
    expect([...subscriptions.values()][0].status).toBe('UNSUBSCRIBED');
  });
});

describe('unsubscribeSubscription', () => {
  it('da de baja una suscripción confirmada y es idempotente', async () => {
    const { store, subscriptions } = createMemoryStore([
      buildRecord({ status: 'CONFIRMED', confirmedAt: new Date('2026-03-01T10:00:00.000Z') }),
    ]);

    const first = await unsubscribeSubscription({
      store,
      token: 'unsubscribe-token',
      nowIso: '2026-03-05T10:00:00.000Z',
    });
    const second = await unsubscribeSubscription({
      store,
      token: 'unsubscribe-token',
      nowIso: '2026-03-06T10:00:00.000Z',
    });

    expect(first).toEqual({ status: 'unsubscribed' });
    expect(second).toEqual({ status: 'already_unsubscribed' });
    expect([...subscriptions.values()][0].status).toBe('UNSUBSCRIBED');
  });

  it('también da de baja una suscripción pendiente', async () => {
    const { store, subscriptions } = createMemoryStore([buildRecord()]);

    await unsubscribeSubscription({
      store,
      token: 'unsubscribe-token',
      nowIso: '2026-03-05T10:00:00.000Z',
    });

    expect([...subscriptions.values()][0].status).toBe('UNSUBSCRIBED');
  });

  it('rechaza tokens desconocidos', async () => {
    const { store } = createMemoryStore([buildRecord()]);

    await expect(
      unsubscribeSubscription({ store, token: 'desconocido', nowIso: '2026-03-05T10:00:00.000Z' })
    ).resolves.toEqual({ status: 'invalid' });
  });
});

describe('elegibilidad del envío mensual', () => {
  const confirmedDuringMarch = {
    status: 'CONFIRMED' as const,
    confirmedAt: new Date('2026-03-15T10:00:00.000Z'),
  };

  it('incluye a quien estaba confirmado antes de que el mes terminara', () => {
    expect(isEligibleForMonthDigest(confirmedDuringMarch, '2026-03')).toBe(true);
  });

  it('excluye a quien se confirmó después de cerrar el mes', () => {
    expect(isEligibleForMonthDigest(confirmedDuringMarch, '2026-02')).toBe(false);
  });

  it('excluye suscripciones no confirmadas, dadas de baja o sin fecha', () => {
    expect(isEligibleForMonthDigest({ status: 'PENDING', confirmedAt: null }, '2026-03')).toBe(false);
    expect(
      isEligibleForMonthDigest(
        { status: 'UNSUBSCRIBED', confirmedAt: new Date('2026-03-01T10:00:00.000Z') },
        '2026-03'
      )
    ).toBe(false);
    expect(isEligibleForMonthDigest({ status: 'CONFIRMED', confirmedAt: null }, '2026-03')).toBe(false);
  });

  it('excluye meses inválidos', () => {
    expect(isEligibleForMonthDigest(confirmedDuringMarch, '2026-13')).toBe(false);
  });
});

describe('resolveDeliveryAction', () => {
  const nowMs = Date.parse('2026-04-01T05:30:00.000Z');
  const base = {
    id: 'delivery-1',
    subscriptionId: 'sub-1',
    monthKey: '2026-03',
    attempts: 1,
    claimedAt: new Date('2026-04-01T05:25:00.000Z'),
  };

  it('envía cuando aún no hay control de envíos', () => {
    expect(resolveDeliveryAction(null, nowMs)).toBe('send');
  });

  it('no reenvía un mes ya enviado', () => {
    expect(resolveDeliveryAction({ ...base, status: 'SENT' }, nowMs)).toBe('skip');
  });

  it('reintenta un envío fallido mientras queden intentos', () => {
    expect(
      resolveDeliveryAction({ ...base, status: 'FAILED', attempts: DIGEST_MAX_ATTEMPTS - 1 }, nowMs)
    ).toBe('send');
    expect(
      resolveDeliveryAction({ ...base, status: 'FAILED', attempts: DIGEST_MAX_ATTEMPTS }, nowMs)
    ).toBe('skip');
  });

  it('no duplica un envío en curso, pero recupera un claim abandonado', () => {
    expect(resolveDeliveryAction({ ...base, status: 'PENDING' }, nowMs)).toBe('skip');
    expect(
      resolveDeliveryAction(
        {
          ...base,
          status: 'PENDING',
          claimedAt: new Date(nowMs - DIGEST_STALE_CLAIM_MS - 1),
        },
        nowMs
      )
    ).toBe('send');
  });
});
