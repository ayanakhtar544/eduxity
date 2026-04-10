import { fail } from "@/server/utils/response";

// Re-export mapPrismaError so callers can import from either utils/errorHandler or utils/prisma
export { mapPrismaError } from "@/lib/prisma";

export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  context = "API",
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error: any) {
      const message = error?.message || `${context} failed`;
      return fail(message, 500);
    }
  };
}
