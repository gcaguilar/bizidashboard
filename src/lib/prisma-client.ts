import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import {
  buildPgSearchPathOption,
  normalizeDatabaseSchemaName,
  quotePgIdentifier,
  stripPrismaSchemaParam,
} from './postgres-schema'

type CreatePostgresPrismaClientOptions = {
  databaseUrl?: string
  city?: string
  ensureSchema?: boolean
}

function parseTimeoutMs(name: string): number | null {
  const raw = process.env[name]
  if (!raw) {
    return null
  }

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

/**
 * `search_path` plus optional server-side timeouts. Public API routes set
 * `DATABASE_STATEMENT_TIMEOUT_MS` so a runaway aggregation cannot hold a pool
 * connection forever; jobs and backfills leave it unset (no timeout).
 */
function buildPgConnectionOptions(schema: string): string {
  const options = [buildPgSearchPathOption(schema)]

  const statementTimeoutMs = parseTimeoutMs('DATABASE_STATEMENT_TIMEOUT_MS')
  if (statementTimeoutMs !== null) {
    options.push(`-c statement_timeout=${statementTimeoutMs}`)
  }

  const idleTransactionTimeoutMs = parseTimeoutMs('DATABASE_IDLE_IN_TRANSACTION_TIMEOUT_MS')
  if (idleTransactionTimeoutMs !== null) {
    options.push(`-c idle_in_transaction_session_timeout=${idleTransactionTimeoutMs}`)
  }

  return options.join(' ')
}

export async function createPostgresPrismaClient({
  databaseUrl = process.env.DATABASE_URL,
  city = process.env.CITY,
  ensureSchema = true,
}: CreatePostgresPrismaClientOptions = {}): Promise<PrismaClient> {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to create a PostgreSQL Prisma client.')
  }

  const schema = normalizeDatabaseSchemaName(city)
  const connectionString = stripPrismaSchemaParam(databaseUrl)
  const adapter = new PrismaPg(
    {
      connectionString,
      options: buildPgConnectionOptions(schema),
    },
    {
      schema,
    }
  )
  const client = new PrismaClient({ adapter })

  await client.$connect()

  if (ensureSchema) {
    const quotedSchema = quotePgIdentifier(schema)
    await client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${quotedSchema}`)
  }

  return client
}
