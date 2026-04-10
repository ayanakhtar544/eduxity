 import { auth } from "@/core/firebase/firebaseConfig";

// 🚨 TIMEOUT 60 SECONDS FOR AI GENERATION
const TIMEOUT_MS = 60000;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

const normalizeEndpoint = (endpoint: string) =>
  endpoint.startsWith("/api") ? endpoint : `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

export const apiClient = async <T,>(endpoint: string, options: RequestInit & { timeout?: number } = {}): Promise<T> => {
  const { method = "GET", headers, body, timeout = TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const user = auth.currentUser;
    // Force refresh token if expired
    const token = user ? await user.getIdToken(true).catch(() => null) : null;
    const url = normalizeEndpoint(endpoint);

    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || `Request failed (${response.status})`);
    }

    return payload as T;
  } catch (error) {
    console.error(`[API] ${method} ${endpoint}`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};