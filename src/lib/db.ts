import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

function createBuildPrismaMock(): PrismaClient {
  return new Proxy(() => undefined, {
    get(_target, _property) {
      return createBuildPrismaMock()
    },
    apply(_target, _thisArg, _args) {
      return Promise.reject(new Error('Database not available during build'))
    },
  }) as unknown as PrismaClient
}

async function createPrismaClient(): Promise<PrismaClient> {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    return createBuildPrismaMock()
  }

  const { PrismaPg } = await import('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: dbUrl })
  const client = new PrismaClient({ adapter })

  await client.$connect()
  const city = getCity()
  await client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${city}"`)
  await client.$executeRawUnsafe(`SET search_path TO "${city}", public`)

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

import { DEFAULT_CITY } from './constants'

export function getCity(): string {
  const city = process.env.CITY || DEFAULT_CITY
  return city.toLowerCase()
}
