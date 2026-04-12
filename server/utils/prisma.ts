// File: server/utils/prisma.ts

export function mapPrismaError(error: any): string {
  if (error?.code) {
    switch (error.code) {
      case "P2002":
        return "A record with this information already exists";
      case "P2025":
        return "Record not found";
      case "P1001":
        return "Database connection failed";
      default:
        return `Database error: ${error.code}`;
    }
  }
  return error?.message || "Database operation failed";
}
