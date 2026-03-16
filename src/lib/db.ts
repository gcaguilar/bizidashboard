import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

function createBuildPrismaMock(path: string[] = []): PrismaClient {
  return new Proxy(() => undefined, {
    get(_target, property) {
      return createBuildPrismaMock([...path, String(property)])
    },
    apply(_target, _thisArg, args) {
      const method = path[path.length - 1] ?? ''

      if (method === '$transaction' && typeof args[0] === 'function') {
        return Promise.resolve(args[0](createBuildPrismaMock()))
      }

      if (method === 'count') return Promise.resolve(0)
      if (method === 'findMany') return Promise.resolve([])
      if (method === 'findFirst') return Promise.resolve(null)
      if (method === 'findUnique') return Promise.resolve(null)
      if (method === 'groupBy') return Promise.resolve([])
      if (method === '$queryRaw') return Promise.resolve([])
      if (method === '$executeRaw') return Promise.resolve(0)
      if (method === 'deleteMany') return Promise.resolve({ count: 0 })
      if (method === 'updateMany') return Promise.resolve({ count: 0 })
      if (method === 'create') return Promise.resolve({})
      if (method === 'upsert') return Promise.resolve({})
      if (method === 'update') return Promise.resolve({})

      return Promise.resolve({})
    },
  }) as unknown as PrismaClient
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

const adapter = new PrismaPg({ connectionString: databaseUrl })

export const prisma: PrismaClient = isBuildPhase()
  ? createBuildPrismaMock()
  : globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
