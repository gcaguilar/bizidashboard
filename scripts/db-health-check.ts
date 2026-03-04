import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

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
const prisma = new PrismaClient({ adapter })

type MigrationRow = {
  migration_name: string
  finished_at: string | null
}

async function main() {
  await prisma.$queryRaw`SELECT 1`

  let rows: MigrationRow[] = []

  try {
    rows = await prisma.$queryRaw<MigrationRow[]>`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 1
    `
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('no such table: _prisma_migrations')) {
      console.warn(
        'Database reachable. _prisma_migrations table not found (likely db push/libsql workflow).'
      )
      return
    }
    throw error
  }

  if (rows.length === 0) {
    console.warn('Database reachable, but no migrations recorded yet.')
    return
  }

  const latest = rows[0]
  console.log(
    `Database reachable. Latest migration: ${latest.migration_name} (${latest.finished_at ?? 'pending'}).`
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Database health check failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
