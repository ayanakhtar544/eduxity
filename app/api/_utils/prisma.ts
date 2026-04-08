import { Prisma } from "@/prisma/generated/client";

export function mapPrismaError(error: unknown): { message: string; status: number } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return { message: "Duplicate record", status: 409 };
    }
    if (error.code === "P2025") {
      return { message: "Record not found", status: 404 };
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return { message: "Database connection failed", status: 503 };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return { message: "Database engine failure", status: 503 };
  }

  return { message: "Internal server error", status: 500 };
}
