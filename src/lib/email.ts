/**
 * Envío de correo transaccional (adaptador Resend)
 *
 * Seam único hacia Resend (`resend`, el SDK oficial): el resto del código
 * compone mensajes (`EmailMessage`) y consume un resultado tipado
 * (`SendEmailResult`) sin conocer el SDK. Decisiones de integración:
 *
 * - La clave va siempre en `RESEND_API_KEY`; el remitente, en `EMAIL_FROM`
 *   (debe ser un dominio verificado en Resend). `EMAIL_REPLY_TO` es opcional.
 * - Sin configuración el envío degrada a `not_configured` (sin lanzar
 *   excepciones) para que rutas y jobs puedan avisar sin romperse.
 * - `idempotencyKey` se propaga tal cual: Resend la deduplica durante 24 h y
 *   permite reintentar un envío a medias sin duplicar el correo.
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Clave de idempotencia de Resend (única por envío, máx. 256 caracteres). */
  idempotencyKey?: string;
  tags?: Array<{ name: string; value: string }>;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'not_configured' | 'send_failed'; message: string };

export type EmailConfig = {
  apiKey: string;
  from: string;
  replyTo: string | null;
};

export function getEmailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return null;
  }

  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  return { apiKey, from, replyTo: replyTo ? replyTo : null };
}

export function isEmailConfigured(): boolean {
  return getEmailConfig() !== null;
}

let resendClient: Resend | null = null;
let resendClientApiKey: string | null = null;

function getResendClient(apiKey: string): Resend {
  if (!resendClient || resendClientApiKey !== apiKey) {
    resendClient = new Resend(apiKey);
    resendClientApiKey = apiKey;
  }
  return resendClient;
}

/** Envía un correo. Nunca lanza: el fallo se expresa en el resultado. */
export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  const config = getEmailConfig();
  if (!config) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'Faltan RESEND_API_KEY o EMAIL_FROM.',
    };
  }

  try {
    const { data, error } = await getResendClient(config.apiKey).emails.send({
      from: config.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(config.replyTo ? { replyTo: config.replyTo } : {}),
      ...(message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : {}),
      ...(message.tags && message.tags.length > 0 ? { tags: message.tags } : {}),
    });

    if (error) {
      logger.warn('email.send_failed', { name: error.name, message: error.message });
      return { ok: false, reason: 'send_failed', message: error.message };
    }

    return { ok: true, id: data?.id ?? '' };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Fallo de red enviando el correo.';
    logger.warn('email.send_error', { message: detail });
    return { ok: false, reason: 'send_failed', message: detail };
  }
}
