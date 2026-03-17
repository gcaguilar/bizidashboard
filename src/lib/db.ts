import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

function createBuildPrismaMock(): PrismaClient {
  return new Proxy(() => undefined, {
    get(_target, property) {
      return createBuildPrismaMock()
    },
    apply(_target, _thisArg, args) {
      return Promise.resolve({})
    },
  }) as unknown as PrismaClient
}

async function createPrismaClient(): Promise<PrismaClient> {
  if (isBuildPhase()) {
    return createBuildPrismaMock()
  }

  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    return createBuildPrismaMock()
  }

  const adapter = new PrismaPg({ connectionString: dbUrl })
  const client = new PrismaClient({ adapter })

  await client.$connect()
  await client.$executeRawUnsafe(`SET search_path TO public`)

  return client
}

async function getPrismaClient(): Promise<PrismaClient> {
  if (isBuildPhase()) {
    return createBuildPrismaMock()
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = await createPrismaClient()
  }

  return globalForPrisma.prisma
}

export const prisma = await getPrismaClient()

export function getCity(): string {
  return process.env.CITY || 'zaragoza'
}
