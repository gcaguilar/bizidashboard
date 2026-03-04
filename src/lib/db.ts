import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const DEFAULT_DATABASE_URL = 'file:./data/dev.db'

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

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
