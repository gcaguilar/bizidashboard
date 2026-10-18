import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { resendSendMock, resendConstructorKeys } = vi.hoisted(() => ({
  resendSendMock: vi.fn(),
  resendConstructorKeys: [] as string[],
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendSendMock };

    constructor(apiKey: string) {
      resendConstructorKeys.push(apiKey);
    }
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { getEmailConfig, isEmailConfigured, sendEmail } from '@/lib/email';

describe('email config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('está sin configurar sin clave o sin remitente', () => {
    expect(getEmailConfig()).toBeNull();
    expect(isEmailConfigured()).toBe(false);

    vi.stubEnv('RESEND_API_KEY', 're_xxx');
    expect(getEmailConfig()).toBeNull();

    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('EMAIL_FROM', 'DatosBizi <informes@datosbizi.com>');
    expect(getEmailConfig()).toBeNull();
  });

  it('lee clave, remitente y reply-to opcional', () => {
    vi.stubEnv('RESEND_API_KEY', 're_xxx');
    vi.stubEnv('EMAIL_FROM', 'DatosBizi <informes@datosbizi.com>');
    vi.stubEnv('EMAIL_REPLY_TO', 'hola@datosbizi.com');

    expect(getEmailConfig()).toEqual({
      apiKey: 're_xxx',
      from: 'DatosBizi <informes@datosbizi.com>',
      replyTo: 'hola@datosbizi.com',
    });
    expect(isEmailConfigured()).toBe(true);
  });

  it('trata el reply-to vacío como ausente', () => {
    vi.stubEnv('RESEND_API_KEY', 're_xxx');
    vi.stubEnv('EMAIL_FROM', 'DatosBizi <informes@datosbizi.com>');
    vi.stubEnv('EMAIL_REPLY_TO', '   ');

    expect(getEmailConfig()?.replyTo).toBeNull();
  });
});

describe('sendEmail', () => {
  beforeEach(() => {
    resendSendMock.mockReset();
    resendConstructorKeys.length = 0;
    vi.stubEnv('RESEND_API_KEY', 're_xxx');
    vi.stubEnv('EMAIL_FROM', 'DatosBizi <informes@datosbizi.com>');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('degrada a not_configured y no llama a Resend sin configuración', async () => {
    vi.stubEnv('RESEND_API_KEY', '');

    const result = await sendEmail({
      to: 'ana@example.com',
      subject: 'Asunto',
      html: '<p>Hola</p>',
      text: 'Hola',
    });

    expect(result).toEqual({
      ok: false,
      reason: 'not_configured',
      message: expect.stringContaining('RESEND_API_KEY'),
    });
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it('envía con el remitente, los tags y la clave de idempotencia', async () => {
    resendSendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    const result = await sendEmail({
      to: 'ana@example.com',
      subject: 'Asunto',
      html: '<p>Hola</p>',
      text: 'Hola',
      idempotencyKey: 'report-digest-2026-03/sub-1',
      tags: [{ name: 'category', value: 'report-digest' }],
    });

    expect(result).toEqual({ ok: true, id: 'email-1' });
    expect(resendConstructorKeys).toEqual(['re_xxx']);
    expect(resendSendMock).toHaveBeenCalledWith({
      from: 'DatosBizi <informes@datosbizi.com>',
      to: ['ana@example.com'],
      subject: 'Asunto',
      html: '<p>Hola</p>',
      text: 'Hola',
      idempotencyKey: 'report-digest-2026-03/sub-1',
      tags: [{ name: 'category', value: 'report-digest' }],
    });
  });

  it('añade reply-to solo si está configurado', async () => {
    resendSendMock.mockResolvedValue({ data: { id: 'email-2' }, error: null });
    vi.stubEnv('EMAIL_REPLY_TO', 'hola@datosbizi.com');

    await sendEmail({ to: 'ana@example.com', subject: 'A', html: 'h', text: 't' });

    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'hola@datosbizi.com' })
    );
    expect(Object.keys(resendSendMock.mock.calls[0][0])).not.toContain('idempotencyKey');
    expect(Object.keys(resendSendMock.mock.calls[0][0])).not.toContain('tags');
  });

  it('expresa el error de Resend como send_failed', async () => {
    resendSendMock.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'from is not allowed' },
    });

    const result = await sendEmail({ to: 'ana@example.com', subject: 'A', html: 'h', text: 't' });

    expect(result).toEqual({
      ok: false,
      reason: 'send_failed',
      message: 'from is not allowed',
    });
  });

  it('no lanza si el SDK falla por red', async () => {
    resendSendMock.mockRejectedValue(new Error('network down'));

    const result = await sendEmail({ to: 'ana@example.com', subject: 'A', html: 'h', text: 't' });

    expect(result).toEqual({
      ok: false,
      reason: 'send_failed',
      message: 'network down',
    });
  });
});
