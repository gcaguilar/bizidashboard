/**
 * Auditoria interna del agente social.
 *
 * No sustituye a las metricas de Instagram: sirve para detectar duplicados,
 * saltos y errores antes de que el feed se sienta repetido. Trabaja solo con
 * los registros del SQLite local, sin red y sin relojes implicitos.
 */

import { formatPercent } from '@/lib/format';
import {
  SOCIAL_SLOTS,
  type SocialPostRecord,
  type SocialSlot,
} from '@/lib/social/types';

export type SocialAuditOptions = {
  now: Date;
  /** Ventana en dias; por defecto, 30. */
  windowDays?: number;
};

type SlotCounts = {
  total: number;
  sent: number;
  skipped: number;
  errors: number;
  active: number;
};

export type SocialAuditReport = {
  windowDays: number;
  since: string;
  total: number;
  sent: number;
  skipped: number;
  errors: number;
  active: number;
  skipRate: number;
  errorRate: number;
  /** Repeticiones sobre el total de apariciones de estacion. */
  duplicateStationShare: number;
  repeatedStations: Array<{ stationId: string; posts: number }>;
  /** Distritos distintos que aparecieron en piezas enviadas. */
  districtsShown: string[];
  bySlot: Record<SocialSlot, SlotCounts>;
};

function recordTimestamp(record: SocialPostRecord): number {
  return Date.parse(
    record.publishedAt ?? record.updatedAt ?? record.createdAt
  );
}

function emptySlotCounts(): SlotCounts {
  return { total: 0, sent: 0, skipped: 0, errors: 0, active: 0 };
}

/** Resumen determinista de los ultimos registros; no consulta la red. */
export function buildSocialAudit(
  records: readonly SocialPostRecord[],
  options: SocialAuditOptions
): SocialAuditReport {
  const windowDays = Math.max(1, Math.trunc(options.windowDays ?? 30));
  const sinceMs = options.now.getTime() - windowDays * 24 * 60 * 60 * 1000;
  const since = new Date(sinceMs).toISOString();

  const inWindow = records.filter((record) => {
    const at = recordTimestamp(record);
    return Number.isFinite(at) && at >= sinceMs;
  });

  const bySlot = Object.fromEntries(
    SOCIAL_SLOTS.map((slot) => [slot, emptySlotCounts()])
  ) as Record<SocialSlot, SlotCounts>;

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  let active = 0;

  for (const record of inWindow) {
    const counts = bySlot[record.slot] ?? emptySlotCounts();
    counts.total += 1;
    bySlot[record.slot] = counts;

    if (record.status === 'sent') {
      sent += 1;
      counts.sent += 1;
    } else if (record.status === 'skipped') {
      skipped += 1;
      counts.skipped += 1;
    } else if (record.status === 'error') {
      errors += 1;
      counts.errors += 1;
    } else {
      active += 1;
      counts.active += 1;
    }
  }

  const stationPosts = new Map<string, number>();
  const districts = new Set<string>();

  for (const record of inWindow) {
    if (record.status !== 'sent') {
      continue;
    }

    const seenInPost = new Set<string>();
    for (const stationId of record.metadata?.stationIds ?? []) {
      const id = stationId.trim();
      if (id && !seenInPost.has(id)) {
        seenInPost.add(id);
        stationPosts.set(id, (stationPosts.get(id) ?? 0) + 1);
      }
    }

    for (const district of record.metadata?.districtNames ?? []) {
      const name = district.trim();
      if (name) {
        districts.add(name);
      }
    }
  }

  const appearances = Array.from(stationPosts.values()).reduce(
    (total, count) => total + count,
    0
  );
  const repeatedStations = Array.from(stationPosts, ([stationId, posts]) => ({
    stationId,
    posts,
  }))
    .filter((entry) => entry.posts > 1)
    .sort(
      (left, right) =>
        right.posts - left.posts || left.stationId.localeCompare(right.stationId)
    );

  const duplicateAppearances = repeatedStations.reduce(
    (total, entry) => total + entry.posts - 1,
    0
  );

  const total = inWindow.length;

  return {
    windowDays,
    since,
    total,
    sent,
    skipped,
    errors,
    active,
    skipRate: total > 0 ? skipped / total : 0,
    errorRate: total > 0 ? errors / total : 0,
    duplicateStationShare:
      appearances > 0 ? duplicateAppearances / appearances : 0,
    repeatedStations,
    districtsShown: Array.from(districts).sort((left, right) =>
      left.localeCompare(right)
    ),
    bySlot,
  };
}

/** Texto para `social:status`; sin colores para que se lea igual en CI. */
export function formatSocialAudit(report: SocialAuditReport): string {
  const lines = [
    `Auditoría social · últimos ${report.windowDays} días (desde ${report.since.slice(0, 10)})`,
    `Publicaciones: ${report.total} · enviadas ${report.sent} · saltadas ${report.skipped} · errores ${report.errors} · activas ${report.active}`,
    `Saltos: ${formatPercent(report.skipRate)} · Errores: ${formatPercent(report.errorRate)}`,
    `Duplicados de estación: ${formatPercent(report.duplicateStationShare)}${report.repeatedStations.length > 0 ? ` (${report.repeatedStations.length} estaciones repetidas)` : ''}`,
    `Barrios distintos mostrados: ${report.districtsShown.length}${report.districtsShown.length > 0 ? ` · ${report.districtsShown.join(', ')}` : ''}`,
    'Por slot:',
  ];

  for (const slot of SOCIAL_SLOTS) {
    const counts = report.bySlot[slot];
    lines.push(
      `  ${slot.padEnd(9)} ${counts.sent} enviadas · ${counts.skipped} saltadas · ${counts.errors} errores · ${counts.active} activas`
    );
  }

  return lines.join('\n');
}
