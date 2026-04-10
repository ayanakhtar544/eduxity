// Location: core/logger.ts
export const Logger = {
  info: (event: string, meta?: any) => console.log(`[INFO] ${event}`, meta || ''),
  warn: (event: string, meta?: any) => console.warn(`[WARN] ${event}`, meta || ''),
  error: (event: string, error: any) => console.error(`[ERROR] ${event}`, error?.message || error),
};

// Alias for server-side code that uses coreLogger
export const coreLogger = Logger;