/**
 * API client for communicating with the BudgetBot server.
 * Uses fetch with session cookie management via expo-secure-store.
 */

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/config';

const SESSION_COOKIE_KEY = 'budgetbot_session';

let sessionCookie: string | null = null;

/** Load session cookie from secure storage on app start */
export async function loadSession(): Promise<void> {
  try {
    sessionCookie = await SecureStore.getItemAsync(SESSION_COOKIE_KEY);
  } catch {
    sessionCookie = null;
  }
}

/** Save session cookie to secure storage */
async function saveSession(cookie: string): Promise<void> {
  sessionCookie = cookie;
  try {
    await SecureStore.setItemAsync(SESSION_COOKIE_KEY, cookie);
  } catch {
    // Secure store might not be available in some environments
  }
}

/** Clear session cookie */
export async function clearSession(): Promise<void> {
  sessionCookie = null;
  try {
    await SecureStore.deleteItemAsync(SESSION_COOKIE_KEY);
  } catch {
    // Ignore
  }
}

/** Extract Set-Cookie header and store the session */
function extractAndStoreSessionCookie(response: Response): void {
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    // Extract the session cookie value
    const match = setCookie.match(/connect\.sid=([^;]+)/);
    if (match) {
      saveSession(`connect.sid=${match[1]}`);
    }
  }
}

/**
 * Core API request function.
 * Attaches session cookie and handles common error patterns.
 */
export async function apiRequest<T = unknown>(
  method: string,
  path: string,
  data?: unknown,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Store session cookie from response
  extractAndStoreSessionCookie(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError('Session expired, please login again', 401);
    }
    if (response.status === 403) {
      throw new ApiError('Insufficient permissions', 403);
    }
    if (response.status >= 500) {
      throw new ApiError('Service temporarily unavailable', response.status);
    }

    let errorMessage = 'Request failed';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      // Could not parse error body
    }
    throw new ApiError(errorMessage, response.status);
  }

  // Some endpoints return empty body (204, etc.)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  return response.json();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Upload file (for receipts, voice).
 */
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {};
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  extractAndStoreSessionCookie(response);

  if (!response.ok) {
    let errorMessage = 'Upload failed';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      // Ignore
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}
