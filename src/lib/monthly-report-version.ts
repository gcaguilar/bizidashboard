/**
 * Version del payload persistido del informe mensual. Se sube cuando cambia la
 * forma del informe o cuando un backfill exige invalidar todos los snapshots.
 * Redis y Postgres comparten esta version para no servir artefactos antiguos.
 */
export const MONTHLY_REPORT_SCHEMA_VERSION = 1;
export const MONTHLY_REPORT_CACHE_VERSION = 'v2';
