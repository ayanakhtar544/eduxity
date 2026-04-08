import { auth } from "@/core/firebase/firebaseConfig";

const TIMEOUT_MS = 10000;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

const normalizeEndpoint = (endpoint: string) =>
  endpoint.startsWith("/api") ? endpoint : `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

export const apiClient = async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const { method = "GET", headers, body } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken().catch(() => null) : null;
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