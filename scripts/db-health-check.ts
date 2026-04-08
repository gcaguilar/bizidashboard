import { createPostgresPrismaClient } from '../src/lib/prisma-client'
import { normalizeDatabaseSchemaName } from '../src/lib/postgres-schema'

const databaseUrl = process.env.DATABASE_URL
const city = normalizeDatabaseSchemaName(process.env.CITY)

type MigrationRow = {
  migration_name: string
  finished_at: string | null
}

async function main() {
  if (!databaseUrl) {
    console.warn('DATABASE_URL is not set; skipping db:health check.')
    return
  }

  const prisma = await createPostgresPrismaClient({
    databaseUrl,
    city,
    ensureSchema: false,
  })

  try {
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
      if (
        message.includes('_prisma_migrations') &&
        (message.includes('does not exist') || message.includes('relation'))
      ) {
        console.warn(
          'Database reachable. _prisma_migrations table not found in current schema.'
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
      `Database reachable (schema: ${city}). Latest migration: ${latest.migration_name} (${latest.finished_at ?? 'pending'}).`
    )
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Database health check failed:', error)
    process.exit(1)
  })
