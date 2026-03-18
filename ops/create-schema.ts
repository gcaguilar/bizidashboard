import pg from 'pg'

const dbUrl = process.env.DATABASE_URL
const city = process.env.CITY || 'zaragoza'

if (!dbUrl) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const VALID_SCHEMA_NAME = /^[a-z][a-z0-9_]{0,62}$/

if (!VALID_SCHEMA_NAME.test(city)) {
  console.error(`Invalid schema name: "${city}". Must match ${VALID_SCHEMA_NAME}`)
  process.exit(1)
}

async function main() {
  console.log(`Creating schema ${city}...`)

  const client = new pg.Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${city}"`)
    console.log(`Schema ${city} created successfully`)
  } catch (error) {
    console.error('Error creating schema:', error)
    throw error
  } finally {
    await client.end()
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
