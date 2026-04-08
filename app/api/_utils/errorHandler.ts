import { fail } from "@/app/api/_utils/response";

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
