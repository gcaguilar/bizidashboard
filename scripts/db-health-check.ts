import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const adapter = new PrismaLibSql({ url: databaseUrl })
const prisma = new PrismaClient({ adapter })

type MigrationRow = {
  migration_name: string
  finished_at: string | null
}

async function main() {
  await prisma.$queryRaw`SELECT 1`

  const rows = await prisma.$queryRaw<MigrationRow[]>`
    SELECT migration_name, finished_at
    FROM _prisma_migrations
    ORDER BY finished_at DESC
    LIMIT 1
  `

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
