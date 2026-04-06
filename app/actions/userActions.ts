// File: src/app/actions/userActions.ts (Example)
import prisma from '@/lib/prisma'

export async function createNewUser(email: string, name: string) {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    })
    return user
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error("Failed to create user")
  }
}