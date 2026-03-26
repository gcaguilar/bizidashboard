import { PrismaClient } from '@prisma/client'
import {
  normalizeDatabaseSchemaName,
} from './postgres-schema'
import { createPostgresPrismaClient } from './prisma-client'

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

  return createPostgresPrismaClient({
    databaseUrl: dbUrl,
    city: getCity(),
  })
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
