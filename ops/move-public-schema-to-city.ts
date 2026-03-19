import pg from 'pg'

const VALID_SCHEMA_NAME = /^[a-z][a-z0-9_]{0,62}$/
const SOURCE_SCHEMA = 'public'

type TablePlan = {
  name: string
  insertColumns: string[]
  selectExpressions: (targetSchema: string, sourceSchema: string) => string[]
}

type TableCount = {
  sourceCount: number
  targetCount: number
}

const TABLE_PLANS: TablePlan[] = [
  {
    name: 'Station',
    insertColumns: [
      'id',
      'name',
      'lat',
      'lon',
      'capacity',
      'isActive',
      'createdAt',
      'updatedAt',
    ],
    selectExpressions: () => [
      '"id"',
      '"name"',
      'lat',
      'lon',
      'capacity',
      '"isActive"',
      '"createdAt"',
      '"updatedAt"',
    ],
  },
  {
    name: 'StationStatus',
    insertColumns: [
      'stationId',
      'bikesAvailable',
      'anchorsFree',
      'recordedAt',
      'createdAt',
    ],
    selectExpressions: () => [
      '"stationId"',
      '"bikesAvailable"',
      '"anchorsFree"',
      '"recordedAt"',
      '"createdAt"',
    ],
  },
  {
    name: 'HourlyStationStat',
    insertColumns: [
      'stationId',
      'bucketStart',
      'bikesMin',
      'bikesMax',
      'bikesAvg',
      'anchorsMin',
      'anchorsMax',
      'anchorsAvg',
      'occupancyAvg',
      'sampleCount',
      'createdAt',
      'updatedAt',
    ],
    selectExpressions: () => [
      '"stationId"',
      '"bucketStart"',
      '"bikesMin"',
      '"bikesMax"',
      '"bikesAvg"',
      '"anchorsMin"',
      '"anchorsMax"',
      '"anchorsAvg"',
      '"occupancyAvg"',
      '"sampleCount"',
      '"createdAt"',
      '"updatedAt"',
    ],
  },
  {
    name: 'DailyStationStat',
    insertColumns: [
      'stationId',
      'bucketDate',
      'bikesMin',
      'bikesMax',
      'bikesAvg',
      'anchorsMin',
      'anchorsMax',
      'anchorsAvg',
      'occupancyAvg',
      'sampleCount',
      'createdAt',
      'updatedAt',
    ],
    selectExpressions: () => [
      '"stationId"',
      '"bucketDate"',
      '"bikesMin"',
      '"bikesMax"',
      '"bikesAvg"',
      '"anchorsMin"',
      '"anchorsMax"',
      '"anchorsAvg"',
      '"occupancyAvg"',
      '"sampleCount"',
      '"createdAt"',
      '"updatedAt"',
    ],
  },
  {
    name: 'StationRanking',
    insertColumns: [
      'stationId',
      'turnoverScore',
      'emptyHours',
      'fullHours',
      'totalHours',
      'windowStart',
      'windowEnd',
      'updatedAt',
    ],
    selectExpressions: () => [
      '"stationId"',
      '"turnoverScore"',
      '"emptyHours"',
      '"fullHours"',
      '"totalHours"',
      '"windowStart"',
      '"windowEnd"',
      '"updatedAt"',
    ],
  },
  {
    name: 'StationPattern',
    insertColumns: [
      'stationId',
      'dayType',
      'hour',
      'bikesAvg',
      'anchorsAvg',
      'occupancyAvg',
      'sampleCount',
    ],
    selectExpressions: (targetSchema) => [
      '"stationId"',
      `"dayType"::text::${qualifyTable(targetSchema, 'DayType')}`,
      'hour',
      '"bikesAvg"',
      '"anchorsAvg"',
      '"occupancyAvg"',
      '"sampleCount"',
    ],
  },
  {
    name: 'StationHeatmapCell',
    insertColumns: [
      'stationId',
      'dayOfWeek',
      'hour',
      'bikesAvg',
      'anchorsAvg',
      'occupancyAvg',
      'sampleCount',
    ],
    selectExpressions: () => [
      '"stationId"',
      '"dayOfWeek"',
      'hour',
      '"bikesAvg"',
      '"anchorsAvg"',
      '"occupancyAvg"',
      '"sampleCount"',
    ],
  },
  {
    name: 'StationAlert',
    insertColumns: [
      'stationId',
      'alertType',
      'severity',
      'metricValue',
      'windowHours',
      'generatedAt',
      'isActive',
    ],
    selectExpressions: (targetSchema) => [
      '"stationId"',
      `"alertType"::text::${qualifyTable(targetSchema, 'AlertType')}`,
      'severity',
      '"metricValue"',
      '"windowHours"',
      '"generatedAt"',
      '"isActive"',
    ],
  },
  {
    name: 'AnalyticsWatermark',
    insertColumns: [
      'name',
      'lastAggregatedAt',
      'updatedAt',
    ],
    selectExpressions: () => [
      'name',
      '"lastAggregatedAt"',
      '"updatedAt"',
    ],
  },
  {
    name: 'MobilityBriefingCache',
    insertColumns: [
      'dateKey',
      'payload',
      'sourceLastDay',
      'generatedAt',
      'updatedAt',
    ],
    selectExpressions: () => [
      '"dateKey"',
      'payload',
      '"sourceLastDay"',
      '"generatedAt"',
      '"updatedAt"',
    ],
  },
  {
    name: 'Install',
    insertColumns: [
      'id',
      'installId',
      'platform',
      'appVersion',
      'osVersion',
      'publicKey',
      'refreshToken',
      'isActive',
      'createdAt',
      'updatedAt',
    ],
    selectExpressions: () => [
      'id',
      '"installId"',
      'platform',
      '"appVersion"',
      '"osVersion"',
      '"publicKey"',
      '"refreshToken"',
      '"isActive"',
      '"createdAt"',
      '"updatedAt"',
    ],
  },
]

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function qualifyTable(schema: string, name: string): string {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(name)}`
}

function getTargetSchema(): string {
  const schema = process.env.CITY?.trim() || 'zaragoza'

  if (!VALID_SCHEMA_NAME.test(schema)) {
    throw new Error(
      `Invalid CITY schema "${schema}". Must match ${String(VALID_SCHEMA_NAME)}`
    )
  }

  if (schema === SOURCE_SCHEMA) {
    throw new Error('CITY must not be public for this migration script.')
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

function shouldApply(): boolean {
  return process.argv.includes('--apply')
}

async function tableExists(
  client: pg.Client,
  schema: string,
  table: string
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM pg_class cls
        JOIN pg_namespace ns ON ns.oid = cls.relnamespace
        WHERE ns.nspname = $1
          AND cls.relname = $2
          AND cls.relkind = 'r'
      ) AS "exists"
    `,
    [schema, table]
  )

  return Boolean(result.rows[0]?.exists)
}

async function countRows(
  client: pg.Client,
  schema: string,
  table: string
): Promise<number> {
  if (!(await tableExists(client, schema, table))) {
    return 0
  }

  const result = await client.query<{ count: number | string | bigint }>(
    `SELECT COUNT(*)::int AS count FROM ${qualifyTable(schema, table)}`
  )

  return Number(result.rows[0]?.count ?? 0)
}

async function collectTableCounts(
  client: pg.Client,
  sourceSchema: string,
  targetSchema: string
): Promise<Record<string, TableCount>> {
  const result: Record<string, TableCount> = {}

  for (const plan of TABLE_PLANS) {
    result[plan.name] = {
      sourceCount: await countRows(client, sourceSchema, plan.name),
      targetCount: await countRows(client, targetSchema, plan.name),
    }
  }

  return result
}

function printTableCounts(
  sourceSchema: string,
  targetSchema: string,
  counts: Record<string, TableCount>
): void {
  console.log(`[Move] Source schema: ${sourceSchema}`)
  console.log(`[Move] Target schema: ${targetSchema}`)
  console.log('[Move] Row counts:')

  for (const plan of TABLE_PLANS) {
    const row = counts[plan.name]
    console.log(
      `  - ${plan.name}: ${sourceSchema}=${row.sourceCount}, ${targetSchema}=${row.targetCount}`
    )
  }
}

async function copyTable(
  client: pg.Client,
  sourceSchema: string,
  targetSchema: string,
  plan: TablePlan
): Promise<number> {
  const sourceTable = qualifyTable(sourceSchema, plan.name)
  const targetTable = qualifyTable(targetSchema, plan.name)
  const insertColumns = plan.insertColumns.map(quoteIdentifier).join(', ')
  const selectExpressions = plan.selectExpressions(targetSchema, sourceSchema).join(', ')

  const result = await client.query<{ count: number | string | bigint }>(`
    WITH moved AS (
      INSERT INTO ${targetTable} (${insertColumns})
      SELECT ${selectExpressions}
      FROM ${sourceTable}
      ON CONFLICT DO NOTHING
      RETURNING 1
    )
    SELECT COUNT(*)::int AS count FROM moved
  `)

  return Number(result.rows[0]?.count ?? 0)
}

async function main() {
  const sourceSchema = SOURCE_SCHEMA
  const targetSchema = getTargetSchema()
  const apply = shouldApply()
  const connectionString = getConnectionString()
  const client = new pg.Client({ connectionString })
  const advisoryLockKey = `move-public-schema-to-city:${targetSchema}`

  await client.connect()

  try {
    const targetHasStation = await tableExists(client, targetSchema, 'Station')
    const targetHasStationStatus = await tableExists(client, targetSchema, 'StationStatus')

    if (!targetHasStation || !targetHasStationStatus) {
      throw new Error(
        `Target schema ${targetSchema} is missing required tables. Run prisma migrate deploy first.`
      )
    }

    await client.query('SELECT pg_advisory_lock(hashtext($1))', [advisoryLockKey])

    console.log(`[Move] Mode: ${apply ? 'apply' : 'dry-run'}`)
    const before = await collectTableCounts(client, sourceSchema, targetSchema)
    printTableCounts(sourceSchema, targetSchema, before)

    if (!apply) {
      console.log('[Move] Dry run complete. Re-run with --apply to copy rows into the city schema.')
      console.log('[Move] Source rows in public are left untouched in all modes.')
      return
    }

    await client.query('BEGIN')

    const insertedByTable: Array<{ table: string; inserted: number }> = []
    for (const plan of TABLE_PLANS) {
      const inserted = await copyTable(client, sourceSchema, targetSchema, plan)
      insertedByTable.push({ table: plan.name, inserted })
      console.log(`[Move] Copied ${inserted} rows into ${targetSchema}.${plan.name}`)
    }

    await client.query('COMMIT')

    const after = await collectTableCounts(client, sourceSchema, targetSchema)
    printTableCounts(sourceSchema, targetSchema, after)

    console.log('[Move] Insert summary:')
    insertedByTable.forEach((row) => {
      console.log(`  - ${row.table}: ${row.inserted}`)
    })

    console.log('[Move] Copy completed successfully. Source rows in public were not deleted.')
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Ignore rollback failures after failed BEGIN/connection-level errors.
    }

    throw error
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
  console.error('[Move] Failed:', error)
  process.exit(1)
})
