/**
 * Request test helpers
 *
 * Helpers for mocking Express requests in tests.
 */

import { vi } from 'vitest';

interface MockRequest {
  body: Record<string, unknown>;
  params: Record<string, string>;
  query: Record<string, string>;
  user?: { id: number };
  headers: Record<string, string>;
  ip: string;
  isAuthenticated: () => boolean;
  login: (user: unknown, callback: (err?: Error) => void) => void;
  logout: (callback: (err?: Error) => void) => void;
}

interface MockResponse {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  cookie: ReturnType<typeof vi.fn>;
  clearCookie: ReturnType<typeof vi.fn>;
  redirect: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock Express request
 */
export function createMockRequest(overrides: Partial<MockRequest> = {}): MockRequest {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    isAuthenticated: vi.fn().mockReturnValue(false),
    login: vi.fn((_, cb) => cb()),
    logout: vi.fn((cb) => cb()),
    ...overrides,
  };
}

/**
 * Creates a mock Express response
 */
export function createMockResponse(): MockResponse {
  const res: MockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Creates mock next function
 */
export function createMockNext() {
  return vi.fn();
}
