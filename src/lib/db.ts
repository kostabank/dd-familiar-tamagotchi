import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query'],
  })

// Cache the Prisma client on the global object to prevent multiple instances
// during hot reloading in dev AND across serverless function invocations.
if (!globalForPrisma.prisma) globalForPrisma.prisma = db
