import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: typeof PrismaClient.prototype }

export const prisma = globalForPrisma.prisma || new (PrismaClient as any)()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
