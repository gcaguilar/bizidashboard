/**
 * Estado y auditoria del agente social desde la linea de comandos.
 *
 * Lee el SQLite local (`SOCIAL_STATE_DB`) y resume los ultimos envios sin
 * llamar a Buffer ni a Instagram. No necesita `SOCIAL_ENABLED`.
 *
 * Uso:
 *   bun scripts/social-status.ts [--days 30] [--limit 200]
 */

import { buildSocialAudit, formatSocialAudit } from '@/lib/social/audit';
import { getSocialConfig } from '@/lib/social/config';
import { createBunSqliteStateStore } from '@/lib/social/state';

function readInteger(argv: string[], flag: string, fallback: number): number {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return fallback;
  }

  const raw = argv[index + 1];
  const value = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${flag} necesita un entero positivo`);
  }

  return value;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Uso: bun scripts/social-status.ts [--days 30] [--limit 200]');
    return;
  }

  const days = readInteger(argv, '--days', 30);
  const limit = readInteger(argv, '--limit', 200);
  const config = getSocialConfig();
  const state = await createBunSqliteStateStore(config.stateDbPath);

  try {
    const posts = await state.listRecentPosts(limit);
    const report = buildSocialAudit(posts, { now: new Date(), windowDays: days });
    console.log(formatSocialAudit(report));
  } finally {
    await state.close();
  }
}

await main();
