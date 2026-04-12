import { auth } from "@/core/firebase/firebaseConfig";

// 🚨 TIMEOUT 60 SECONDS FOR NETWORK REQUESTS
const TIMEOUT_MS = 60000;
const DEFAULT_RETRY_COUNT = 2;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

const normalizeEndpoint = (endpoint: string) =>
  endpoint.startsWith("/api")
    ? endpoint
    : `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit & { timeout?: number; retry?: number } = {},
): Promise<T> => {
  const {
    method = "GET",
    headers,
    body,
    timeout = TIMEOUT_MS,
    retry = DEFAULT_RETRY_COUNT,
  } = options;
  const isWeb = typeof window !== "undefined";
  const normalizedEndpoint = normalizeEndpoint(endpoint);

  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  const url = isAbsoluteUrl(endpoint)
    ? endpoint
    : isWeb || !baseUrl
      ? normalizedEndpoint
      : `${baseUrl}${normalizedEndpoint}`;

  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const requestBody =
    body && typeof body !== "string" ? JSON.stringify(body) : body;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((headers as Record<string, string>) || {}),
  };

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < retry) {
    attempt += 1;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let parsedRequestBody: unknown;
      try {
        parsedRequestBody = requestBody
          ? JSON.parse(String(requestBody))
          : undefined;
      } catch {
        parsedRequestBody = requestBody;
      }

      console.log(`🌐 apiClient attempt ${attempt}: ${method} ${url}`, {
        body: parsedRequestBody,
      });

      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: requestHeaders,
        ...(requestBody ? { body: requestBody } : {}),
      });

      const payload = await response.json().catch(() => ({}));
      console.log(
        `🌐 apiClient response ${response.status}: ${method} ${url}`,
        payload,
      );

      const errorMessage =
        payload?.error || `Request failed (${response.status})`;
      if (!response.ok) {
        const shouldRetry =
          (response.status >= 500 || response.status === 429) &&
          attempt < retry;
        if (shouldRetry) {
          lastError = new Error(errorMessage);
          continue;
        }
        throw new Error(errorMessage);
      }

      if (payload?.success === false) {
        const shouldRetry = attempt < retry;
        if (shouldRetry) {
          lastError = new Error(payload.error || "Request returned failure");
          continue;
        }
        throw new Error(payload.error || "Request returned failure");
      }

      return payload as T;
    } catch (error) {
      lastError = error;
      const isAbort = (error as any)?.name === "AbortError";
      if (isAbort) {
        console.warn(`🌐 apiClient timeout: ${method} ${url}`);
      } else {
        console.error(
          `❌ apiClient error (attempt ${attempt}): ${method} ${url}`,
          error,
        );
      }
      if (attempt >= retry) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
};
