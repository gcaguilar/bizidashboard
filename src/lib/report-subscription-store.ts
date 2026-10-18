/**
 * Adaptador Prisma del puerto `ReportSubscriptionStore`
 *
 * Traducción mecánica entre el dominio de suscripciones
 * (`src/lib/report-subscriptions.ts`) y las tablas `ReportSubscription` /
 * `ReportDelivery`. No contiene política: solo consultas y mutaciones.
 */

import { prisma } from '@/lib/db';
import type { PrismaClient } from '@/generated/prisma/client';
import type {
  ReportDeliveryRecord,
  ReportSubscriptionRecord,
  ReportSubscriptionStore,
} from '@/lib/report-subscriptions';

export function createReportSubscriptionStore(
  client: PrismaClient = prisma
): ReportSubscriptionStore {
  return {
    async findByEmail(email: string): Promise<ReportSubscriptionRecord | null> {
      const row = await client.reportSubscription.findUnique({ where: { email } });
      return row ?? null;
    },

    async findByConfirmToken(token: string): Promise<ReportSubscriptionRecord | null> {
      const row = await client.reportSubscription.findUnique({ where: { confirmToken: token } });
      return row ?? null;
    },

    async findByUnsubscribeToken(token: string): Promise<ReportSubscriptionRecord | null> {
      const row = await client.reportSubscription.findUnique({
        where: { unsubscribeToken: token },
      });
      return row ?? null;
    },

    async createPending(input: {
      email: string;
      confirmToken: string;
      unsubscribeToken: string;
    }): Promise<ReportSubscriptionRecord> {
      return client.reportSubscription.create({ data: input });
    },

    async resetToPending(
      id: string,
      input: { confirmToken: string; unsubscribeToken: string }
    ): Promise<ReportSubscriptionRecord> {
      return client.reportSubscription.update({
        where: { id },
        data: {
          status: 'PENDING',
          confirmToken: input.confirmToken,
          unsubscribeToken: input.unsubscribeToken,
          confirmedAt: null,
          unsubscribedAt: null,
        },
      });
    },

    async markConfirmed(id: string, confirmedAt: Date): Promise<ReportSubscriptionRecord> {
      return client.reportSubscription.update({
        where: { id },
        data: { status: 'CONFIRMED', confirmedAt },
      });
    },

    async markUnsubscribed(id: string, unsubscribedAt: Date): Promise<ReportSubscriptionRecord> {
      return client.reportSubscription.update({
        where: { id },
        data: { status: 'UNSUBSCRIBED', unsubscribedAt },
      });
    },

    async listConfirmed(): Promise<ReportSubscriptionRecord[]> {
      return client.reportSubscription.findMany({
        where: { status: 'CONFIRMED' },
        orderBy: { createdAt: 'asc' },
      });
    },

    async findDelivery(
      subscriptionId: string,
      monthKey: string
    ): Promise<ReportDeliveryRecord | null> {
      const row = await client.reportDelivery.findUnique({
        where: { subscriptionId_monthKey: { subscriptionId, monthKey } },
      });
      return row ?? null;
    },

    /**
     * Reclama el envío de un mes para una suscripción. El upsert es atómico:
     * crea la fila como `PENDING` con el primer intento, o reutiliza la
     * existente marcando un intento más. El caller decide cuándo procede
     * reintentar (`resolveDeliveryAction`).
     */
    async claimDelivery(input: {
      subscriptionId: string;
      monthKey: string;
      claimedAt: Date;
    }): Promise<ReportDeliveryRecord> {
      return client.reportDelivery.upsert({
        where: {
          subscriptionId_monthKey: {
            subscriptionId: input.subscriptionId,
            monthKey: input.monthKey,
          },
        },
        create: {
          subscriptionId: input.subscriptionId,
          monthKey: input.monthKey,
          status: 'PENDING',
          attempts: 1,
          claimedAt: input.claimedAt,
        },
        update: {
          status: 'PENDING',
          attempts: { increment: 1 },
          claimedAt: input.claimedAt,
        },
      });
    },

    async markDeliverySent(id: string, resendId: string, sentAt: Date): Promise<void> {
      await client.reportDelivery.update({
        where: { id },
        data: { status: 'SENT', resendId, sentAt, lastError: null },
      });
    },

    async markDeliveryFailed(id: string, error: string): Promise<void> {
      await client.reportDelivery.update({
        where: { id },
        data: { status: 'FAILED', lastError: error.slice(0, 500) },
      });
    },
  };
}

export const reportSubscriptionStore: ReportSubscriptionStore = createReportSubscriptionStore();
