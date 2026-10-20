/**
 * Backfill de DailySystemStat.
 *
 * 1. Rellena todo el historico desde DailyStationStat (rapido y aproximado en
 *    ocupacion/balance).
 * 2. Recalcula en exacto los ultimos N dias desde StationStatus, que es lo que
 *    conserva la retencion cruda (30 dias por defecto).
 *
 * Uso:
 *   npx tsx scripts/backfill-daily-system-stat.ts [diasExactos]
 *
 * Tambien se ejecuta solo la primera vez que corre el job de analitica si la
 * tabla esta vacia, asi que este script es para forzar el backfill o ampliar la
 * ventana exacta.
 */
import { prisma } from '@/lib/db';
import {
  backfillDailySystemStatsFromRollup,
  refreshDailySystemStats,
  startOfUtcDay,
} from '@/analytics/queries/daily-system';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_EXACT_DAYS = 30;

function parseExactDays(): number {
  const raw = process.argv[2] ?? process.env.DAILY_SYSTEM_STAT_EXACT_DAYS;
  const parsed = Number.parseInt(raw ?? '', 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_EXACT_DAYS;
  }

  return parsed;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required to backfill DailySystemStat.');
    process.exitCode = 1;
    return;
  }

  const exactDays = parseExactDays();
  const to = startOfUtcDay();
  const from = new Date(to.getTime() - exactDays * DAY_MS);

  const approximateDays = await backfillDailySystemStatsFromRollup();
  const exact = await refreshDailySystemStats(from, to);

  console.log(
    `DailySystemStat: ${approximateDays} dias aproximados desde DailyStationStat, ` +
      `${exact.days} dias exactos desde StationStatus ` +
      `(${from.toISOString()} -> ${to.toISOString()}).`
  );
}

main()
  .catch((error) => {
    console.error('DailySystemStat backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
