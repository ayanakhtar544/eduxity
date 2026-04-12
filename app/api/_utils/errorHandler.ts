import { fail } from "./response";

export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  context = "API",
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error: any) {
      const message = error?.message || `${context} failed`;
      console.error(`[${context}] Error:`, error);
      return fail(message, 500);
    }
  };
}

export function handleApiError(error: any): Response {
  const message = error?.message || "API failed";
  console.error("[API] Error:", error);
  return fail(message, 500);
}
