/**
 * Suscripciones al informe mensual
 *
 * Dueño del dominio de suscripción por email: estados, tokens de confirmación
 * y baja, elegibilidad del envío mensual y control de envíos. El resto del
 * código no conoce el almacenamiento ni el transporte:
 *
 * - `ReportSubscriptionStore` es el puerto que rellena el adaptador Prisma
 *   (`report-subscription-store.ts`) o un almacén en memoria en tests.
 * - El envío de correos se inyecta como función (`SubscriptionEmailSender`),
 *   de modo que la lógica se prueba sin Resend.
 * - Las URLs de confirmación y baja se inyectan como fábricas: este módulo no
 *   conoce rutas, solo compone enlaces.
 *
 * Flujo de doble opt-in: `requestReportSubscription` deja la suscripción en
 * `PENDING` y envía el correo de confirmación; `confirmSubscription` pasa a
 * `CONFIRMED`; `unsubscribeSubscription` da de baja desde cualquier estado.
 * Una suscripción dada de baja vuelve a `PENDING` si se pide de nuevo, para
 * que la confirmación sea siempre un acto explícito.
 */

import { randomBytes } from 'node:crypto';
import type { EmailMessage, SendEmailResult } from '@/lib/email';
import { buildSubscriptionConfirmationEmail } from '@/lib/report-email';
import { getMonthBounds, isValidMonthKey } from '@/lib/months';

export type ReportSubscriptionStatus = 'PENDING' | 'CONFIRMED' | 'UNSUBSCRIBED';
export type ReportDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED';

export type ReportSubscriptionRecord = {
  id: string;
  email: string;
  status: ReportSubscriptionStatus;
  confirmToken: string;
  unsubscribeToken: string;
  confirmedAt: Date | null;
  createdAt: Date;
};

export type ReportDeliveryRecord = {
  id: string;
  subscriptionId: string;
  monthKey: string;
  status: ReportDeliveryStatus;
  attempts: number;
  claimedAt: Date;
};

/** Puerto de persistencia: lo implementa Prisma y los tests en memoria. */
export type ReportSubscriptionStore = {
  findByEmail: (email: string) => Promise<ReportSubscriptionRecord | null>;
  findByConfirmToken: (token: string) => Promise<ReportSubscriptionRecord | null>;
  findByUnsubscribeToken: (token: string) => Promise<ReportSubscriptionRecord | null>;
  createPending: (input: {
    email: string;
    confirmToken: string;
    unsubscribeToken: string;
  }) => Promise<ReportSubscriptionRecord>;
  resetToPending: (
    id: string,
    input: { confirmToken: string; unsubscribeToken: string }
  ) => Promise<ReportSubscriptionRecord>;
  markConfirmed: (id: string, confirmedAt: Date) => Promise<ReportSubscriptionRecord>;
  markUnsubscribed: (id: string, unsubscribedAt: Date) => Promise<ReportSubscriptionRecord>;
  listConfirmed: () => Promise<ReportSubscriptionRecord[]>;
  findDelivery: (
    subscriptionId: string,
    monthKey: string
  ) => Promise<ReportDeliveryRecord | null>;
  claimDelivery: (input: {
    subscriptionId: string;
    monthKey: string;
    claimedAt: Date;
  }) => Promise<ReportDeliveryRecord>;
  markDeliverySent: (id: string, resendId: string, sentAt: Date) => Promise<void>;
  markDeliveryFailed: (id: string, error: string) => Promise<void>;
};

export type SubscriptionEmailSender = (message: EmailMessage) => Promise<SendEmailResult>;

// ── Validación y tokens ─────────────────────────────────────────────────────

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LENGTH = 254;
export const MAX_SUBSCRIPTION_TOKEN_LENGTH = 256;

export function normalizeSubscriptionEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidSubscriptionEmail(email: string): boolean {
  return (
    email.length > 0 &&
    email.length <= MAX_EMAIL_LENGTH &&
    !email.includes('..') &&
    EMAIL_PATTERN.test(email)
  );
}

/** Token opaco de capacidad (confirmación o baja), apto para URL. */
export function generateSubscriptionToken(): string {
  return randomBytes(24).toString('base64url');
}

function isValidToken(token: string): boolean {
  return token.length > 0 && token.length <= MAX_SUBSCRIPTION_TOKEN_LENGTH;
}

// ── Elegibilidad y control de envíos del informe mensual ────────────────────

/** Reintentos de un envío fallido antes de desistir de forma definitiva. */
export const DIGEST_MAX_ATTEMPTS = 3;

/** Un claim más viejo que esto es un run interrumpido, no un envío en curso. */
export const DIGEST_STALE_CLAIM_MS = 15 * 60 * 1000;

/**
 * El informe de un mes se envía a quien estaba suscrito (confirmado) cuando el
 * mes terminó. Quien se apunta después recibe el informe del mes siguiente, no
 * un envío tardío del periodo ya cerrado.
 */
export function isEligibleForMonthDigest(
  subscription: Pick<ReportSubscriptionRecord, 'status' | 'confirmedAt'>,
  monthKey: string
): boolean {
  if (subscription.status !== 'CONFIRMED' || !subscription.confirmedAt) {
    return false;
  }
  if (!isValidMonthKey(monthKey)) {
    return false;
  }

  const { endExclusive } = getMonthBounds(monthKey);
  return subscription.confirmedAt.getTime() < Date.parse(endExclusive);
}

/**
 * Decide si un envío pendiente de control debe reintentarse. `null` (sin
 * registro) significa que aún no se ha intentado nunca.
 */
export function resolveDeliveryAction(
  delivery: ReportDeliveryRecord | null,
  nowMs: number
): 'send' | 'skip' {
  if (!delivery) {
    return 'send';
  }
  if (delivery.status === 'SENT') {
    return 'skip';
  }
  if (delivery.status === 'PENDING') {
    return nowMs - delivery.claimedAt.getTime() > DIGEST_STALE_CLAIM_MS ? 'send' : 'skip';
  }
  return delivery.attempts < DIGEST_MAX_ATTEMPTS ? 'send' : 'skip';
}

// ── Servicios de suscripción ────────────────────────────────────────────────

export type RequestSubscriptionDeps = {
  store: ReportSubscriptionStore;
  send: SubscriptionEmailSender;
  /** URL absoluta del enlace de confirmación para un token dado. */
  confirmUrl: (token: string) => string;
  nowIso: string;
};

export type RequestSubscriptionResult =
  | { status: 'pending' }
  | { status: 'already_confirmed' }
  | { status: 'invalid' }
  | { status: 'unavailable' };

/**
 * Pide la suscripción y envía el correo de confirmación (doble opt-in). Si ya
 * existía una suscripción pendiente o dada de baja, se reactiva como
 * `PENDING` con tokens nuevos: los enlaces antiguos dejan de valer.
 */
export async function requestReportSubscription(
  rawEmail: string,
  deps: RequestSubscriptionDeps
): Promise<RequestSubscriptionResult> {
  const email = normalizeSubscriptionEmail(rawEmail);
  if (!isValidSubscriptionEmail(email)) {
    return { status: 'invalid' };
  }

  const existing = await deps.store.findByEmail(email);
  if (existing?.status === 'CONFIRMED') {
    return { status: 'already_confirmed' };
  }

  const tokens = {
    confirmToken: generateSubscriptionToken(),
    unsubscribeToken: generateSubscriptionToken(),
  };
  const record = existing
    ? await deps.store.resetToPending(existing.id, tokens)
    : await deps.store.createPending({ email, ...tokens });

  const confirmation = buildSubscriptionConfirmationEmail({
    confirmUrl: deps.confirmUrl(record.confirmToken),
  });
  const result = await deps.send({
    to: record.email,
    subject: confirmation.subject,
    html: confirmation.html,
    text: confirmation.text,
    idempotencyKey: `report-confirm/${record.id}`,
    tags: [
      { name: 'category', value: 'report-subscription' },
      { name: 'flow', value: 'confirm' },
    ],
  });

  if (!result.ok) {
    return { status: 'unavailable' };
  }

  return { status: 'pending' };
}

export type ConfirmSubscriptionResult = {
  status: 'confirmed' | 'already_confirmed' | 'invalid';
};

/**
 * Confirma una suscripción pendiente. Solo la transición `PENDING → CONFIRMED`
 * vale: un enlace antiguo no reactiva una suscripción dada de baja (eso exige
 * volver a pedirla desde el formulario).
 */
export async function confirmSubscription(deps: {
  store: ReportSubscriptionStore;
  token: string;
  nowIso: string;
}): Promise<ConfirmSubscriptionResult> {
  const token = deps.token.trim();
  if (!isValidToken(token)) {
    return { status: 'invalid' };
  }

  const record = await deps.store.findByConfirmToken(token);
  if (!record) {
    return { status: 'invalid' };
  }
  if (record.status === 'CONFIRMED') {
    return { status: 'already_confirmed' };
  }
  if (record.status !== 'PENDING') {
    return { status: 'invalid' };
  }

  await deps.store.markConfirmed(record.id, new Date(deps.nowIso));
  return { status: 'confirmed' };
}

export type UnsubscribeSubscriptionResult = {
  status: 'unsubscribed' | 'already_unsubscribed' | 'invalid';
};

/** Da de baja desde cualquier estado (pendiente o confirmado). */
export async function unsubscribeSubscription(deps: {
  store: ReportSubscriptionStore;
  token: string;
  nowIso: string;
}): Promise<UnsubscribeSubscriptionResult> {
  const token = deps.token.trim();
  if (!isValidToken(token)) {
    return { status: 'invalid' };
  }

  const record = await deps.store.findByUnsubscribeToken(token);
  if (!record) {
    return { status: 'invalid' };
  }
  if (record.status === 'UNSUBSCRIBED') {
    return { status: 'already_unsubscribed' };
  }

  await deps.store.markUnsubscribed(record.id, new Date(deps.nowIso));
  return { status: 'unsubscribed' };
}
