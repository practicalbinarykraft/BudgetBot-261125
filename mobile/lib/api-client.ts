import { storage } from "./storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

export async function apiRequest<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = await storage.getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    await storage.clear();
    if (onUnauthorized) {
      onUnauthorized();
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get<T = any>(path: string): Promise<T> {
    return apiRequest<T>(path, { method: "GET" });
  },

  post<T = any>(path: string, data?: unknown): Promise<T> {
    return apiRequest<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch<T = any>(path: string, data?: unknown): Promise<T> {
    return apiRequest<T>(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T = any>(path: string): Promise<T> {
    return apiRequest<T>(path, { method: "DELETE" });
  },
};
