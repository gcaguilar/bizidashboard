import { PrismaClient } from './node_modules/.prisma/client/client'
const prisma = new PrismaClient({})
console.log('Prisma client created:', !!prisma)
