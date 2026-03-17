import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const dbUrl = process.env.DATABASE_URL
const city = process.env.CITY || 'zaragoza'

if (!dbUrl) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

async function main() {
  console.log(`Creating schema ${city}...`)
  
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: dbUrl })
  })

  try {
    await client.$connect()
    await client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${city}`)
    console.log(`Schema ${city} created successfully`)
  } catch (error) {
    console.error('Error creating schema:', error)
    throw error
  } finally {
    await client.$disconnect()
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
