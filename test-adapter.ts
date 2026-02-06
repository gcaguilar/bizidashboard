import { PrismaClient } from './node_modules/.prisma/client/client'
import { PrismaSQLite } from '@prisma/adapter-libsql'
const adapter = new PrismaSQLite({url: 'file:./dev.db'})
const prisma = new PrismaClient({ adapter })
console.log('Prisma client created:', !!prisma)
