import { Prisma } from '@/generated/prisma/client';

/**
 * Definicion unica de la "demanda" de una estacion: el movimiento neto de bicis
 * y anclajes entre el minimo y el maximo de una fila agregada. Rankings,
 * informes y conclusiones leen la demanda a traves de estos fragmentos, de modo
 * que la formula vive en un solo sitio y no puede divergir entre consultas.
 */
function column(alias: string | undefined, name: string): Prisma.Sql {
  return Prisma.raw(alias ? `"${alias}"."${name}"` : `"${name}"`);
}

/** `("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")`, con alias de tabla opcional. */
export function demandPerRow(alias?: string): Prisma.Sql {
  return Prisma.sql`(${column(alias, 'bikesMax')} - ${column(alias, 'bikesMin')}) + (${column(
    alias,
    'anchorsMax'
  )} - ${column(alias, 'anchorsMin')})`;
}

/** `SUM(<demanda por fila>)`. */
export function sumDemand(alias?: string): Prisma.Sql {
  return Prisma.sql`SUM(${demandPerRow(alias)})`;
}

/** `COALESCE(SUM(<demanda por fila>), 0)`. */
export function coalesceSumDemand(alias?: string): Prisma.Sql {
  return Prisma.sql`COALESCE(${sumDemand(alias)}, 0)`;
}

/** `AVG(<demanda por fila>)`. */
export function avgDemand(alias?: string): Prisma.Sql {
  return Prisma.sql`AVG(${demandPerRow(alias)})`;
}
