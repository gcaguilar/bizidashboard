import { serverHandlers } from '@tests/helpers/route-handlers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { isEmailConfiguredMock, sendEmailMock, storeMocks } = vi.hoisted(() => ({
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

vi.mock('@/lib/email', () => ({
  isEmailConfigured: isEmailConfiguredMock,
  sendEmail: sendEmailMock,
}));

vi.mock('@/lib/report-subscription-store', () => ({
  reportSubscriptionStore: storeMocks,
}));

import { Route as subscribeRoute } from '@/app/api/reports/subscribe/index';
import { Route as confirmRoute } from '@/app/api/reports/subscribe/confirm/index';
import { Route as unsubscribeRoute } from '@/app/api/reports/subscribe/unsubscribe/index';

const subscribeHandler = serverHandlers(subscribeRoute).POST!;
const confirmHandler = serverHandlers(confirmRoute).GET!;
const unsubscribeHandler = serverHandlers(unsubscribeRoute).GET!;

const pendingRecord = {
  id: 'sub-1',
  email: 'ana@example.com',
  status: 'PENDING',
  confirmToken: 'confirm-token',
  unsubscribeToken: 'unsubscribe-token',
  confirmedAt: null,
  createdAt: new Date('2026-03-01T10:00:00.000Z'),
};

function postSubscribe(body: unknown) {
  return subscribeHandler({
    request: new Request('http://localhost/api/reports/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
}

describe('POST /api/reports/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isEmailConfiguredMock.mockReturnValue(true);
    sendEmailMock.mockResolvedValue({ ok: true, id: 'email-1' });
    storeMocks.findByEmail.mockResolvedValue(null);
    storeMocks.createPending.mockImplementation(async (input: typeof pendingRecord) => ({
      ...pendingRecord,
      email: input.email,
      confirmToken: input.confirmToken,
      unsubscribeToken: input.unsubscribeToken,
    }));
    storeMocks.resetToPending.mockResolvedValue(pendingRecord);
  });

  it('acepta el alta y envía el correo de confirmación (doble opt-in)', async () => {
    const response = await postSubscribe({ email: ' Ana@Example.com ' });
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.status).toBe('pending');
    expect(storeMocks.createPending).toHaveBeenCalledWith({
      email: 'ana@example.com',
      confirmToken: expect.any(String),
      unsubscribeToken: expect.any(String),
    });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock.mock.calls[0][0].text).toContain(
      '/api/reports/subscribe/confirm?token='
    );
  });

  it('rechaza un correo inválido', async () => {
    const response = await postSubscribe({ email: 'no-es-un-correo' });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('no es válido');
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('rechaza un cuerpo sin email', async () => {
    const response = await postSubscribe({});
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('email');
    expect(storeMocks.createPending).not.toHaveBeenCalled();
  });

  it('informa sin correo nuevo si ya estaba suscrito', async () => {
    storeMocks.findByEmail.mockResolvedValue({ ...pendingRecord, status: 'CONFIRMED' });

    const response = await postSubscribe({ email: 'ana@example.com' });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe('already_confirmed');
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('degrada a 503 si el envío de correo no está configurado', async () => {
    isEmailConfiguredMock.mockReturnValue(false);

    const response = await postSubscribe({ email: 'ana@example.com' });
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toContain('no están disponibles');
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(storeMocks.createPending).not.toHaveBeenCalled();
  });

  it('degrada a 503 si el correo de confirmación no se puede enviar', async () => {
    sendEmailMock.mockResolvedValue({ ok: false, reason: 'send_failed', message: 'boom' });

    const response = await postSubscribe({ email: 'ana@example.com' });
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toContain('confirmación');
  });
});

describe('GET /api/reports/subscribe/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMocks.findByConfirmToken.mockResolvedValue(pendingRecord);
    storeMocks.markConfirmed.mockResolvedValue({ ...pendingRecord, status: 'CONFIRMED' });
  });

  it('confirma la suscripción y redirige al archivo con el aviso', async () => {
    const response = await confirmHandler({
      request: new Request(
        'http://localhost/api/reports/subscribe/confirm?token=confirm-token'
      ),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/informes?sub=confirmada');
    expect(storeMocks.markConfirmed).toHaveBeenCalledWith('sub-1', expect.any(Date));
  });

  it('redirige con error ante un token desconocido', async () => {
    storeMocks.findByConfirmToken.mockResolvedValue(null);

    const response = await confirmHandler({
      request: new Request('http://localhost/api/reports/subscribe/confirm?token=otro'),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/informes?sub=error');
    expect(storeMocks.markConfirmed).not.toHaveBeenCalled();
  });
});

describe('GET /api/reports/subscribe/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMocks.findByUnsubscribeToken.mockResolvedValue({
      ...pendingRecord,
      status: 'CONFIRMED',
    });
    storeMocks.markUnsubscribed.mockResolvedValue({ ...pendingRecord, status: 'UNSUBSCRIBED' });
  });

  it('da de baja y redirige al archivo con el aviso', async () => {
    const response = await unsubscribeHandler({
      request: new Request(
        'http://localhost/api/reports/subscribe/unsubscribe?token=unsubscribe-token'
      ),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/informes?sub=baja');
    expect(storeMocks.markUnsubscribed).toHaveBeenCalledWith('sub-1', expect.any(Date));
  });

  it('redirige con error ante un token desconocido', async () => {
    storeMocks.findByUnsubscribeToken.mockResolvedValue(null);

    const response = await unsubscribeHandler({
      request: new Request('http://localhost/api/reports/subscribe/unsubscribe?token=otro'),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/informes?sub=error');
    expect(storeMocks.markUnsubscribed).not.toHaveBeenCalled();
  });
});
