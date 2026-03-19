import { PrismaClient } from '@prisma/client'
import {
  buildPgSearchPathOption,
  normalizeDatabaseSchemaName,
  quotePgIdentifier,
  stripPrismaSchemaParam,
} from './postgres-schema'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

function createBuildPrismaMock(): PrismaClient {
  return new Proxy(() => undefined, {
    get() {
      return createBuildPrismaMock()
    },
    apply() {
      return Promise.reject(new Error('Database not available during build'))
    },
  }) as unknown as PrismaClient
}

async function createPrismaClient(): Promise<PrismaClient> {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    return createBuildPrismaMock()
  }

  const city = getCity()
  const connectionString = stripPrismaSchemaParam(dbUrl)
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const adapter = new PrismaPg(
    {
      connectionString,
      options: buildPgSearchPathOption(city),
    },
    {
      schema: city,
    }
  )
  const client = new PrismaClient({ adapter })

  await client.$connect()
  const quotedSchema = quotePgIdentifier(city)
  await client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${quotedSchema}`)

  return client
}

let _prismaPromise: Promise<PrismaClient> | null = null

function getPrismaClient(): Promise<PrismaClient> {
  if (isBuildPhase()) {
    return Promise.resolve(createBuildPrismaMock())
  }

  if (!globalForPrisma.prisma) {
    if (!_prismaPromise) {
      _prismaPromise = createPrismaClient().then((client) => {
        globalForPrisma.prisma = client
        return client
      }).catch((error) => {
        _prismaPromise = null
        throw error
      })
    }
    return _prismaPromise
  }

  return Promise.resolve(globalForPrisma.prisma)
}

export const prisma = isBuildPhase() || !process.env.DATABASE_URL
  ? createBuildPrismaMock()
  : await getPrismaClient()

export function getCity(): string {
  return normalizeDatabaseSchemaName(process.env.CITY)
}
