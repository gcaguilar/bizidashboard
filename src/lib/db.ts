import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const DEFAULT_DATABASE_URL = 'file:./data/dev.db'

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

function ensureSqliteDirectory(url: string): void {
  if (!url.startsWith('file:')) {
    return
  }

  const rawPath = url.slice('file:'.length).split('?')[0]?.split('#')[0] ?? ''

  if (!rawPath || rawPath === ':memory:') {
    return
  }

  const absolutePath = rawPath.startsWith('/') ? rawPath : resolve(process.cwd(), rawPath)
  mkdirSync(dirname(absolutePath), { recursive: true })
}

const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL
ensureSqliteDirectory(databaseUrl)

const adapter = new PrismaLibSql({ url: databaseUrl })

export const prisma: PrismaClient = isBuildPhase()
  ? createBuildPrismaMock()
  : globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
