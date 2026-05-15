import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

// Parse DATABASE_URL to extract schema
const url = new URL(process.env.DATABASE_URL!)
const schema = url.searchParams.get('schema') || 'public'

// Create a pool scoped to the correct schema
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!.split('?')[0],
})

const adapter = new PrismaPg(pool, { schema })

declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma = globalThis.__prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
