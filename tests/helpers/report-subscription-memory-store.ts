import type {
  ReportDeliveryRecord,
  ReportSubscriptionRecord,
  ReportSubscriptionStore,
} from '@/lib/report-subscriptions';

/**
 * Almacén en memoria del puerto `ReportSubscriptionStore` para tests: guarda
 * suscripciones y controles de envío con la misma semántica que el adaptador
 * Prisma (upsert del claim con intento incrementado).
 */
export function createMemoryReportSubscriptionStore(seed: ReportSubscriptionRecord[] = []) {
  const subscriptions = new Map<string, ReportSubscriptionRecord>(
    seed.map((record) => [record.id, { ...record }])
  );
  type MemoryDelivery = ReportDeliveryRecord & { resendId: string | null; sentAt: Date | null };
  const deliveries = new Map<string, MemoryDelivery>();
  let nextId = seed.length + 1;

  const store: ReportSubscriptionStore = {
    async findByEmail(email) {
      return [...subscriptions.values()].find((record) => record.email === email) ?? null;
    },
    async findByConfirmToken(token) {
      return [...subscriptions.values()].find((record) => record.confirmToken === token) ?? null;
    },
    async findByUnsubscribeToken(token) {
      return [...subscriptions.values()].find((record) => record.unsubscribeToken === token) ?? null;
    },
    async createPending(input) {
      const record: ReportSubscriptionRecord = {
        id: `sub-${nextId++}`,
        email: input.email,
        status: 'PENDING',
        confirmToken: input.confirmToken,
        unsubscribeToken: input.unsubscribeToken,
        confirmedAt: null,
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
      };
      subscriptions.set(record.id, record);
      return record;
    },
    async resetToPending(id, input) {
      const record = subscriptions.get(id);
      if (!record) {
        throw new Error('unknown subscription');
      }
      const updated: ReportSubscriptionRecord = {
        ...record,
        status: 'PENDING',
        confirmToken: input.confirmToken,
        unsubscribeToken: input.unsubscribeToken,
        confirmedAt: null,
      };
      subscriptions.set(id, updated);
      return updated;
    },
    async markConfirmed(id, confirmedAt) {
      const record = subscriptions.get(id);
      if (!record) {
        throw new Error('unknown subscription');
      }
      const updated: ReportSubscriptionRecord = { ...record, status: 'CONFIRMED', confirmedAt };
      subscriptions.set(id, updated);
      return updated;
    },
    async markUnsubscribed(id) {
      const record = subscriptions.get(id);
      if (!record) {
        throw new Error('unknown subscription');
      }
      const updated: ReportSubscriptionRecord = { ...record, status: 'UNSUBSCRIBED' };
      subscriptions.set(id, updated);
      return updated;
    },
    async listConfirmed() {
      return [...subscriptions.values()].filter((record) => record.status === 'CONFIRMED');
    },
    async findDelivery(subscriptionId, monthKey) {
      return deliveries.get(`${subscriptionId}:${monthKey}`) ?? null;
    },
    async claimDelivery(input) {
      const key = `${input.subscriptionId}:${input.monthKey}`;
      const existing = deliveries.get(key);
      const record: MemoryDelivery = existing
        ? {
            ...existing,
            status: 'PENDING',
            attempts: existing.attempts + 1,
            claimedAt: input.claimedAt,
          }
        : {
            id: `delivery-${key}`,
            subscriptionId: input.subscriptionId,
            monthKey: input.monthKey,
            status: 'PENDING',
            attempts: 1,
            claimedAt: input.claimedAt,
            resendId: null,
            sentAt: null,
          };
      deliveries.set(key, record);
      return record;
    },
    async markDeliverySent(id, resendId, sentAt) {
      for (const [key, record] of deliveries) {
        if (record.id === id) {
          deliveries.set(key, { ...record, status: 'SENT', resendId, sentAt });
        }
      }
    },
    async markDeliveryFailed(id) {
      for (const [key, record] of deliveries) {
        if (record.id === id) {
          deliveries.set(key, { ...record, status: 'FAILED' });
        }
      }
    },
  };

  return { store, subscriptions, deliveries };
}
