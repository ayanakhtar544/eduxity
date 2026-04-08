// Location: core/errorHandler.ts
import { Logger } from "./logger";

export type ApiResponse<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export function withErrorHandling(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error: any) {
      Logger.error(`API_CRASH: ${req.url}`, error);
      
      const payload: ApiResponse = { 
        success: false, 
        error: error.message || "Internal Server Error" 
      };
      
      return Response.json(payload, { status: error.status || 500 });
    }
  };
}