import pg from 'pg'

const VALID_SCHEMA_NAME = /^[a-z][a-z0-9_]{0,62}$/
const EXPECTED_UNIQUE_INDEX = 'StationStatus_stationId_recordedAt_key'
const EXPECTED_COMPOSITE_INDEX = 'StationStatus_stationId_recordedAt_idx'
const EXPECTED_RECORDED_AT_INDEX = 'StationStatus_recordedAt_idx'

type TableStats = {
  totalRows: number
  distinctStations: number
  distinctSnapshots: number
}

type SnapshotRow = {
  recordedAt: Date
  rowCount: number
}

type IndexRow = {
  indexname: string
  indexdef: string
}

type ConstraintRow = {
  conname: string
  definition: string
}

type Diagnosis = {
  stats: TableStats
  latestSnapshots: SnapshotRow[]
  indexes: IndexRow[]
  constraints: ConstraintRow[]
  unexpectedUniqueIndexes: IndexRow[]
  unexpectedUniqueConstraints: ConstraintRow[]
  hasExpectedUniqueSnapshotIndex: boolean
}

type SchemaPresence = {
  schema: string
  hasStationStatus: boolean
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function getTargetSchema(): string {
  const schema = process.env.CITY?.trim() || 'zaragoza'

  if (!VALID_SCHEMA_NAME.test(schema)) {
    throw new Error(
      `Invalid CITY schema "${schema}". Must match ${String(VALID_SCHEMA_NAME)}`
    )
  }

  return schema
}

function getConnectionString(): string {
  const rawDatabaseUrl = process.env.DATABASE_URL

  if (!rawDatabaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  const url = new URL(rawDatabaseUrl)
  url.searchParams.delete('schema')
  return url.toString()
}

function shouldApplyFix(): boolean {
  return process.argv.includes('--apply')
}

function formatIndex(row: IndexRow): string {
  return `- ${row.indexname}: ${row.indexdef}`
}

function formatConstraint(row: ConstraintRow): string {
  return `- ${row.conname}: ${row.definition}`
}

async function hasStationStatusTable(
  client: pg.Client,
  schema: string
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM pg_class cls
        JOIN pg_namespace ns ON ns.oid = cls.relnamespace
        WHERE ns.nspname = $1
          AND cls.relname = 'StationStatus'
          AND cls.relkind = 'r'
      ) AS "exists"
    `,
    [schema]
  )

  return Boolean(result.rows[0]?.exists)
}

async function getTableStats(client: pg.Client): Promise<TableStats> {
  const result = await client.query<{
    totalRows: number | string | bigint
    distinctStations: number | string | bigint
    distinctSnapshots: number | string | bigint
  }>(`
    SELECT
      COUNT(*)::int AS "totalRows",
      COUNT(DISTINCT "stationId")::int AS "distinctStations",
      COUNT(DISTINCT "recordedAt")::int AS "distinctSnapshots"
    FROM "StationStatus"
  `)

  return {
    totalRows: Number(result.rows[0]?.totalRows ?? 0),
    distinctStations: Number(result.rows[0]?.distinctStations ?? 0),
    distinctSnapshots: Number(result.rows[0]?.distinctSnapshots ?? 0),
  }
}

async function getLatestSnapshots(client: pg.Client): Promise<SnapshotRow[]> {
  const result = await client.query<{
    recordedAt: Date
    rowCount: number | string | bigint
  }>(`
    SELECT "recordedAt", COUNT(*)::int AS "rowCount"
    FROM "StationStatus"
    GROUP BY "recordedAt"
    ORDER BY "recordedAt" DESC
    LIMIT 10
  `)

  return result.rows.map((row) => ({
    recordedAt: row.recordedAt,
    rowCount: Number(row.rowCount),
  }))
}

async function getIndexes(client: pg.Client, schema: string): Promise<IndexRow[]> {
  const result = await client.query<IndexRow>(
    `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = $1
        AND tablename = 'StationStatus'
      ORDER BY indexname
    `,
    [schema]
  )

  return result.rows
}

async function getConstraints(client: pg.Client, schema: string): Promise<ConstraintRow[]> {
  const result = await client.query<ConstraintRow>(
    `
      SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
      WHERE ns.nspname = $1
        AND rel.relname = 'StationStatus'
      ORDER BY con.conname
    `,
    [schema]
  )

  return result.rows
}

function isUnexpectedStationOnlyUniqueIndex(row: IndexRow): boolean {
  return (
    row.indexdef.includes('CREATE UNIQUE INDEX') &&
    row.indexdef.includes('"StationStatus"') &&
    row.indexdef.includes('("stationId")') &&
    !row.indexdef.includes('("stationId", "recordedAt")')
  )
}

function isUnexpectedStationOnlyUniqueConstraint(row: ConstraintRow): boolean {
  return (
    row.definition.includes('UNIQUE ("stationId")') &&
    !row.definition.includes('"recordedAt"')
  )
}

function hasExpectedUniqueSnapshotIndex(indexes: IndexRow[]): boolean {
  return indexes.some((row) =>
    row.indexdef.includes('CREATE UNIQUE INDEX') &&
    row.indexdef.includes('"StationStatus"') &&
    row.indexdef.includes('("stationId", "recordedAt")')
  )
}

async function collectDiagnosis(
  client: pg.Client,
  schema: string
): Promise<Diagnosis> {
  const [stats, latestSnapshots, indexes, constraints] = await Promise.all([
    getTableStats(client),
    getLatestSnapshots(client),
    getIndexes(client, schema),
    getConstraints(client, schema),
  ])

  const unexpectedUniqueIndexes = indexes.filter(isUnexpectedStationOnlyUniqueIndex)
  const unexpectedUniqueConstraints = constraints.filter(isUnexpectedStationOnlyUniqueConstraint)

  return {
    stats,
    latestSnapshots,
    indexes,
    constraints,
    unexpectedUniqueIndexes,
    unexpectedUniqueConstraints,
    hasExpectedUniqueSnapshotIndex: hasExpectedUniqueSnapshotIndex(indexes),
  }
}

async function collectSchemaPresence(
  client: pg.Client,
  schemas: string[]
): Promise<SchemaPresence[]> {
  const uniqueSchemas = [...new Set(schemas)]
  const result: SchemaPresence[] = []

  for (const schema of uniqueSchemas) {
    result.push({
      schema,
      hasStationStatus: await hasStationStatusTable(client, schema),
    })
  }

  return result
}

function printDiagnosis(schema: string, diagnosis: Diagnosis): void {
  console.log(`[Fix] Schema: ${schema}`)
  console.log('[Fix] StationStatus stats:', diagnosis.stats)

  if (diagnosis.latestSnapshots.length === 0) {
    console.log('[Fix] No snapshots stored yet.')
  } else {
    console.log('[Fix] Latest snapshots:')
    diagnosis.latestSnapshots.forEach((snapshot) => {
      console.log(
        `  - ${snapshot.recordedAt.toISOString()}: ${snapshot.rowCount} rows`
      )
    })
  }

  console.log('[Fix] Indexes:')
  diagnosis.indexes.forEach((row) => console.log(formatIndex(row)))

  console.log('[Fix] Constraints:')
  diagnosis.constraints.forEach((row) => console.log(formatConstraint(row)))

  if (diagnosis.unexpectedUniqueIndexes.length === 0) {
    console.log('[Fix] No unexpected UNIQUE indexes on stationId only.')
  } else {
    console.log('[Fix] Unexpected UNIQUE indexes on stationId only:')
    diagnosis.unexpectedUniqueIndexes.forEach((row) => console.log(formatIndex(row)))
  }

  if (diagnosis.unexpectedUniqueConstraints.length === 0) {
    console.log('[Fix] No unexpected UNIQUE constraints on stationId only.')
  } else {
    console.log('[Fix] Unexpected UNIQUE constraints on stationId only:')
    diagnosis.unexpectedUniqueConstraints.forEach((row) => console.log(formatConstraint(row)))
  }

  console.log(
    `[Fix] Expected UNIQUE (stationId, recordedAt): ${diagnosis.hasExpectedUniqueSnapshotIndex ? 'present' : 'missing'}`
  )
}

async function dropUnexpectedConstraints(
  client: pg.Client,
  schema: string,
  constraints: ConstraintRow[]
): Promise<void> {
  for (const constraint of constraints) {
    console.log(`[Fix] Dropping constraint ${constraint.conname}...`)
    await client.query(
      `ALTER TABLE ${quoteIdentifier(schema)}."StationStatus" DROP CONSTRAINT IF EXISTS ${quoteIdentifier(constraint.conname)}`
    )
  }
}

async function dropUnexpectedIndexes(
  client: pg.Client,
  schema: string,
  indexes: IndexRow[]
): Promise<void> {
  for (const index of indexes) {
    console.log(`[Fix] Dropping index ${index.indexname}...`)
    await client.query(
      `DROP INDEX IF EXISTS ${quoteIdentifier(schema)}.${quoteIdentifier(index.indexname)}`
    )
  }
}

async function deleteExactSnapshotDuplicates(client: pg.Client): Promise<number> {
  const result = await client.query(`
    DELETE FROM "StationStatus" AS duplicate
    USING "StationStatus" AS original
    WHERE duplicate."stationId" = original."stationId"
      AND duplicate."recordedAt" = original."recordedAt"
      AND duplicate.id > original.id
  `)

  return result.rowCount ?? 0
}

async function ensureExpectedIndexes(client: pg.Client): Promise<void> {
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "${EXPECTED_UNIQUE_INDEX}"
    ON "StationStatus"("stationId", "recordedAt")
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS "${EXPECTED_COMPOSITE_INDEX}"
    ON "StationStatus"("stationId", "recordedAt")
  `)

  await client.query(`
    CREATE INDEX IF NOT EXISTS "${EXPECTED_RECORDED_AT_INDEX}"
    ON "StationStatus"("recordedAt")
  `)
}

async function main() {
  const schema = getTargetSchema()
  const connectionString = getConnectionString()
  const applyFix = shouldApplyFix()
  const client = new pg.Client({ connectionString })
  const advisoryLockKey = `fix-station-status-indexes:${schema}`

  await client.connect()

  try {
    const schemaPresence = await collectSchemaPresence(client, [schema, 'public'])
    const targetSchemaPresent = schemaPresence.find((entry) => entry.schema === schema)

    if (!targetSchemaPresent?.hasStationStatus) {
      throw new Error(
        `Table ${schema}.StationStatus does not exist. Run prisma migrate deploy first.`
      )
    }

    if (schema !== 'public') {
      const publicPresence = schemaPresence.find((entry) => entry.schema === 'public')
      console.log(
        `[Fix] public.StationStatus present: ${publicPresence?.hasStationStatus ? 'yes' : 'no'}`
      )
    }

    await client.query(`SET search_path TO ${quoteIdentifier(schema)}, public`)
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [advisoryLockKey])

    console.log(`[Fix] Mode: ${applyFix ? 'apply' : 'dry-run'}`)
    const before = await collectDiagnosis(client, schema)
    printDiagnosis(schema, before)

    if (schema !== 'public') {
      const publicPresence = await hasStationStatusTable(client, 'public')
      if (publicPresence) {
        await client.query('SET search_path TO "public"')
        const publicDiagnosis = await collectDiagnosis(client, 'public')
        console.log('[Fix] --- Comparison: public schema ---')
        printDiagnosis('public', publicDiagnosis)
        await client.query(`SET search_path TO ${quoteIdentifier(schema)}, public`)

        if (before.stats.totalRows === 0 && publicDiagnosis.stats.totalRows > 0) {
          console.log(
            '[Fix] Warning: target schema is empty while public schema has StationStatus rows. The app may be writing to public instead of CITY.'
          )
        }
      }
    }

    if (!applyFix) {
      console.log('[Fix] Dry run complete. Re-run with --apply to execute changes.')
      return
    }

    await dropUnexpectedConstraints(client, schema, before.unexpectedUniqueConstraints)
    await dropUnexpectedIndexes(client, schema, before.unexpectedUniqueIndexes)

    const deletedDuplicates = await deleteExactSnapshotDuplicates(client)
    console.log(`[Fix] Deleted ${deletedDuplicates} exact duplicate rows.`)

    await ensureExpectedIndexes(client)

    const after = await collectDiagnosis(client, schema)
    printDiagnosis(schema, after)

    if (after.unexpectedUniqueConstraints.length > 0) {
      throw new Error('Unexpected UNIQUE constraints on stationId still exist after fix.')
    }

    if (after.unexpectedUniqueIndexes.length > 0) {
      throw new Error('Unexpected UNIQUE indexes on stationId still exist after fix.')
    }

    if (!after.hasExpectedUniqueSnapshotIndex) {
      throw new Error('Expected UNIQUE index on (stationId, recordedAt) is still missing.')
    }

    console.log('[Fix] StationStatus indexes repaired successfully.')
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(hashtext($1))', [advisoryLockKey])
    } catch {
      // Ignore unlock failures during teardown.
    }

    await client.end()
  }
}

main().catch((error) => {
  console.error('[Fix] Failed:', error)
  process.exit(1)
})
