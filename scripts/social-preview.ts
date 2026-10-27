/**
 * Preview local de un slot social: genera las imagenes y muestra el texto, sin
 * subir nada a tmpfiles, sin llamar a Buffer y sin escribir en el SQLite de
 * estado.
 *
 * Uso:
 *   bun scripts/social-preview.ts --slot morning
 *   bun scripts/social-preview.ts --slot weekly --date 2026-10-26 --out .tmp/social
 *
 * Por defecto escribe en `.tmp/social` (ignorado por git).
 * Puede necesitar Postgres (lecturas de analitica) y el GeoJSON de distritos.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { getSocialConfig } from '@/lib/social/config';
import {
  getSlotDateKey,
  isValidDateKey,
  SOCIAL_SLOT_SCHEDULE,
  zonedTimeToUtc,
} from '@/lib/social/data';
import { renderSocialContent } from '@/lib/social/render';
import { SOCIAL_SLOTS, type SocialSlot } from '@/lib/social/types';

const USAGE =
  'Uso: bun scripts/social-preview.ts --slot morning|afternoon|weekly|monthly [--date YYYY-MM-DD] [--out DIR] (por defecto .tmp/social)';

type PreviewOptions = {
  slot: SocialSlot;
  date: string | null;
  out: string;
};

function readValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Falta el valor de ${flag}\n${USAGE}`);
  }

  return value;
}

function parseArgs(argv: string[]): PreviewOptions {
  let slot: string | null = null;
  let date: string | null = null;
  let out = '.tmp/social';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case '--slot':
        slot = readValue(argv, index, '--slot');
        index += 1;
        break;
      case '--date':
        date = readValue(argv, index, '--date');
        index += 1;
        break;
      case '--out':
        out = readValue(argv, index, '--out');
        index += 1;
        break;
      case '--help':
      case '-h':
        console.log(USAGE);
        process.exit(0);
        break;
      default:
        throw new Error(`Argumento no reconocido: ${arg}\n${USAGE}`);
    }
  }

  if (!slot || !SOCIAL_SLOTS.includes(slot as SocialSlot)) {
    throw new Error(`--slot debe ser uno de: ${SOCIAL_SLOTS.join(', ')}\n${USAGE}`);
  }

  if (date && !isValidDateKey(date)) {
    throw new Error(`--date debe tener formato YYYY-MM-DD: ${date}`);
  }

  if (!out.trim()) {
    throw new Error('--out no puede estar vacio');
  }

  return { slot: slot as SocialSlot, date, out };
}

/**
 * Los adaptadores se importan de forma dinamica: asi `--help` o un argumento
 * invalido no abren conexion con Postgres. Al construir el slot si se necesita
 * base de datos, tal como documenta el comando.
 */
async function buildPreview(
  slot: SocialSlot,
  now: Date,
  config: ReturnType<typeof getSocialConfig>
) {
  const deps = { now, config };

  switch (slot) {
    case 'morning':
      return (await import('@/jobs/social/morning')).runMorningSlot(deps);
    case 'afternoon':
      return (await import('@/jobs/social/afternoon')).runAfternoonSlot(deps);
    case 'weekly':
      return (await import('@/jobs/social/weekly')).runWeeklySlot(deps);
    case 'monthly':
      return (await import('@/jobs/social/monthly')).runMonthlySlot(deps);
    default:
      return null;
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const config = getSocialConfig();
  const schedule = SOCIAL_SLOT_SCHEDULE[options.slot];
  const now = options.date
    ? zonedTimeToUtc(options.date, schedule.hour, schedule.minute, config.timezone)
    : new Date();
  const content = await buildPreview(options.slot, now, config);

  if (!content) {
    console.error(
      `Sin datos suficientes para el slot "${options.slot}" (${getSlotDateKey(
        options.slot,
        now,
        config.timezone
      )}). No se genera preview.`
    );
    process.exitCode = 1;
    return;
  }

  const images = renderSocialContent(content);
  const directory = resolve(options.out);
  await mkdir(directory, { recursive: true });

  const files: string[] = [];
  for (let index = 0; index < images.length; index += 1) {
    const file = join(directory, `${options.slot}-${content.dateKey}-${index + 1}.jpg`);
    await writeFile(file, images[index]!);
    files.push(file);
  }

  console.log(`Slot: ${options.slot}`);
  console.log(`Fecha de estado: ${content.dateKey}`);
  console.log(`Titular: ${content.headline}`);
  console.log(`Caption:\n${content.caption}`);
  console.log(`Alt text:\n${content.altText}`);
  console.log(`Imagenes (${files.length}):`);
  for (const file of files) {
    console.log(`- ${file}`);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
