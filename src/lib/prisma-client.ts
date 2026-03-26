import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
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
      options: buildPgSearchPathOption(schema),
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
