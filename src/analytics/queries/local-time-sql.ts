import { Prisma } from '@/generated/prisma/client';
import { TIMEZONE } from '@/lib/timezone';

/**
 * Hora y dia de la semana locales (Europe/Madrid) de una columna `timestamp`
 * guardada en UTC. Toda consulta que agrupe por franja horaria debe leer la
 * hora a traves de estos fragmentos, igual que los rollups de patrones
 * (`getLocalBucket`), para que perfiles, picos y redistribucion coincidan.
 */
function localTimestamp(column: string): Prisma.Sql {
  return Prisma.sql`((${Prisma.raw(`"${column}"`)} AT TIME ZONE 'UTC') AT TIME ZONE ${TIMEZONE}::text)`;
}

/** `EXTRACT(HOUR FROM <columna en hora de Madrid>)::int`. */
export function localHour(column = 'bucketStart'): Prisma.Sql {
  return Prisma.sql`EXTRACT(HOUR FROM ${localTimestamp(column)})::int`;
}

/** `EXTRACT(DOW FROM <columna en hora de Madrid>)::int` (0 = domingo). */
export function localDow(column = 'bucketStart'): Prisma.Sql {
  return Prisma.sql`EXTRACT(DOW FROM ${localTimestamp(column)})::int`;
}
