import { PrismaClient } from '@prisma/client'

// PrismaClient ka instance globally define kar rahe hain
// Taaki TypeScript ko globalThis.prisma ka type pata chal sake
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Production-ready Singleton instance
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Development me queries aur warnings console me print karega (debugging ke liye best)
    // Production me sirf errors print karega
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

// Agar hum development environment me hain, toh instance ko global object me save kar do
// Taaki jab Next.js file ko hot-reload kare, toh wo purana connection hi reuse kare
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Default export taaki kisi bhi file me easily import kar sakein
export default prisma