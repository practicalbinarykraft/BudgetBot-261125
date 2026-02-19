# Testing Patterns

**Analysis Date:** 2026-02-19

## Test Framework

**Runner:**
- Vitest (v4.0.13) for server-side unit and integration tests
- Playwright (v1.57.0) for E2E tests
- Jest (mobile-specific) for React Native tests (via `npm run test:mobile`)
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in assertions (`expect()`)
- Testing Library for DOM queries (`@testing-library/react`, `@testing-library/jest-dom`)
- happy-dom (v20.0.10) as test environment

**Run Commands:**
```bash
npm run test              # Run all Vitest tests in watch mode
npm run test:ui          # Run with Vitest UI
npm run test:run         # Run once (non-watch)
npm run test:coverage    # Generate coverage report (v8 provider)
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # E2E tests with Playwright UI
npm run test:e2e:headed  # E2E tests with visible browser
npm run test:e2e:debug   # Debug mode (browser dev tools)
npm run test:e2e:report  # View HTML report
npm run test:mobile      # Jest for React Native (from mobile/)
```

## Test File Organization

**Location:**
- Co-located: `server/services/__tests__/{service}.test.ts` next to the service
- Co-located: `server/repositories/__tests__/{repo}.test.ts` next to repository
- Co-located: `server/lib/__tests__/{module}.test.ts` next to utility
- Dedicated test directories: `tests/e2e/`, `tests/fixtures/`, `tests/helpers/`
- Middleware tests: `server/middleware/__tests__/{middleware}.test.ts`

**Naming:**
- Unit/integration: `{module}.test.ts` (co-located in `__tests__/`)
- E2E: `{feature}.spec.ts` (in `tests/e2e/`)
- Fixtures: `{entity}.fixture.ts` (in `tests/fixtures/`)
- Helpers: `{utility}.helper.ts` (in `tests/helpers/`)

**Structure:**
```
server/
├── services/
│   ├── notification.service.ts
│   └── __tests__/
│       └── notification.service.test.ts
├── repositories/
│   ├── user.repository.ts
│   └── __tests__/
│       └── user.repository.test.ts
└── lib/
    ├── errors.ts
    └── __tests__/
        └── errors.test.ts

tests/
├── e2e/
│   ├── auth.spec.ts
│   ├── health.spec.ts
│   └── ...
├── fixtures/
│   ├── transaction.fixture.ts
│   ├── user.fixture.ts
│   └── index.ts (barrel export)
└── helpers/
    ├── db.helper.ts
    ├── request.helper.ts
    └── index.ts (barrel export)
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    vi.mocked(repository.getAll).mockResolvedValue([]);
  });

  describe('checkAndCreateNotifications', () => {
    it('should create notification for planned expense that reached target date', async () => {
      // Arrange: Set up test data and mocks
      const userId = 1;
      const plannedExpense = { id: 1, status: 'planned', targetDate: '2024-01-15' };
      vi.mocked(repository.getPlanned).mockResolvedValue([plannedExpense]);

      // Act: Call the function
      await notificationService.checkAndCreateNotifications(userId);

      // Assert: Verify expected behavior
      expect(repository.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        type: 'planned_expense',
        plannedTransactionId: 1,
      }), userId);
    });

    it('should skip future transactions', async () => {
      // Arrange
      const plannedFuture = { targetDate: '2099-01-01', status: 'planned' };
      vi.mocked(repository.getPlanned).mockResolvedValue([plannedFuture]);

      // Act
      await notificationService.checkAndCreateNotifications(1);

      // Assert
      expect(repository.createNotification).not.toHaveBeenCalled();
    });
  });
});
```

**Patterns:**
- Arrange-Act-Assert (AAA) structure: Setup → Execute → Verify
- Mock setup in `beforeEach()` with `vi.clearAllMocks()`
- Default mocks return empty arrays or null
- Override mocks per test: `vi.mocked(fn).mockResolvedValue(...)`
- Verify with `expect()` assertions

From `server/lib/__tests__/errors.test.ts`:
```typescript
describe('Error Classes', () => {
  describe('AppError', () => {
    it('creates error with correct properties', () => {
      const error = new AppError(400, 'Test error', 'TEST_ERROR', { foo: 'bar' });
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ foo: 'bar' });
    });

    it('serializes to JSON correctly', () => {
      const error = new AppError(400, 'Test', 'TEST', { detail: 1 });
      const json = error.toJSON();
      expect(json.error).toBe('Test');
      expect(json.code).toBe('TEST');
    });
  });
});
```

## Mocking

**Framework:** Vitest `vi` module

**Patterns:**
```typescript
// Mock entire module before importing it
vi.mock('../repositories/user.repository', () => ({
  userRepository: {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    getUserById: vi.fn(),
  },
}));

// Import after mocking
import { userRepository } from '../repositories/user.repository';

// In test: set mock behavior
beforeEach(() => {
  vi.clearAllMocks();
});

it('should handle database result', async () => {
  // Mock resolved value
  vi.mocked(userRepository.getUserByEmail).mockResolvedValue({
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  });

  const user = await userRepository.getUserByEmail('test@example.com');
  expect(user?.email).toBe('test@example.com');
});

it('should handle null result', async () => {
  // Mock null return
  vi.mocked(userRepository.getUserByEmail).mockResolvedValue(null);

  const user = await userRepository.getUserByEmail('nonexistent@example.com');
  expect(user).toBeNull();
});

it('should verify call arguments', async () => {
  vi.mocked(userRepository.createUser).mockResolvedValue({ id: 1 });

  await userRepository.createUser({ email: 'new@example.com', password: 'hash' });

  expect(userRepository.createUser).toHaveBeenCalledWith(
    expect.objectContaining({ email: 'new@example.com' })
  );
});
```

**What to Mock:**
- External APIs (Anthropic, OpenAI, Telegram) - never call real endpoints in tests
- Database repositories - isolate service logic from data layer
- Service dependencies - test one thing at a time
- Time-based functions - use `vi.useFakeTimers()` or pass dates as parameters

**What NOT to Mock:**
- Error classes (test actual behavior)
- Utility functions (crypto, date-fns, validators)
- Schema/Type definitions
- Constants and enums

## Fixtures and Factories

**Test Data:**

From `tests/fixtures/user.fixture.ts`:
```typescript
export const createTestUser = (scenario: string) => {
  const timestamp = Date.now();
  return {
    email: `user-${scenario}-${timestamp}@test.example.com`,
    password: 'TestPassword123!',
    name: `Test User ${scenario}`,
  };
};
```

From `tests/fixtures/transaction.fixture.ts`:
```typescript
export const createMockTransaction = (overrides?: Partial<Transaction>): Transaction => {
  return {
    id: 1,
    userId: 1,
    amount: '100.00',
    currency: 'USD',
    category: 'Food',
    description: 'Test transaction',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    ...overrides,
  };
};
```

**Location:**
- `tests/fixtures/` - centralized test data factory functions
- Exported via `tests/fixtures/index.ts` barrel file
- Named with `create{EntityName}` pattern for clarity
- Support overrides for test-specific variations

## Coverage

**Requirements:** No enforced minimum

**View Coverage:**
```bash
npm run test:coverage
# Opens coverage/index.html with v8 provider
```

**Coverage Config (from `vitest.config.ts`):**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'node_modules/',
    'tests/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/mockData',
    'dist/',
  ],
}
```

## Test Types

**Unit Tests:**
- Scope: Single function or service method
- Approach: Mock all dependencies, test logic in isolation
- Location: `server/services/__tests__/` or `server/lib/__tests__/`
- Example: Testing `getApiKey()` with different credit scenarios

**Integration Tests:**
- Scope: Multiple services or layers working together
- Approach: Use real database (from `.env` DATABASE_URL) or test DB
- Located alongside unit tests, marked with comments: `// Integration test`
- Example: Notification service checking multiple repositories

**E2E Tests:**
- Framework: Playwright (v1.57.0)
- Scope: Full user flows (auth, create transaction, etc.)
- Location: `tests/e2e/{feature}.spec.ts`
- Pattern: Navigate → Act → Verify
- Use helpers for reusable steps: `AuthHelper`, `createTestUser()`

From `tests/e2e/auth.spec.ts`:
```typescript
test('should register new user successfully', async ({ page }) => {
  const testUser = createTestUser('register');

  await authHelper.register(testUser.email, testUser.password, testUser.name);

  expect(page.url()).toMatch(/\/app\/(dashboard|dashboard-v2)/);
});
```

## Common Patterns

**Async Testing:**
```typescript
it('should load user data', async () => {
  vi.mocked(userRepository.getUserById).mockResolvedValue({
    id: 1,
    email: 'test@example.com',
  });

  const user = await userService.loadUser(1);

  expect(user?.email).toBe('test@example.com');
});

it('should handle async errors', async () => {
  vi.mocked(userRepository.getUserById).mockRejectedValue(
    new Error('Database connection failed')
  );

  await expect(userService.loadUser(1)).rejects.toThrow('Database connection failed');
});
```

**Error Testing:**
```typescript
it('should throw validation error for invalid email', async () => {
  const invalidUser = { email: 'invalid', password: 'test' };

  expect(() => {
    validateUserInput(invalidUser);
  }).toThrow(ValidationError);
});

it('should catch and convert unknown errors', async () => {
  vi.mocked(externalApi.call).mockRejectedValue(new TypeError('Network error'));

  const result = await service.callApi();

  expect(result.error).toBeDefined();
});
```

**Date Testing:**
```typescript
it('should create notification for due date', async () => {
  const today = new Date().toISOString().split('T')[0];

  const planned = {
    id: 1,
    targetDate: today,
    status: 'planned',
  };

  vi.mocked(repository.getPlanned).mockResolvedValue([planned]);

  await service.checkAndCreateNotifications(1);

  expect(repository.createNotification).toHaveBeenCalled();
});
```

## Setup and Configuration

**Global Setup:** `tests/setup.ts`
```typescript
// Runs before all tests
// Sets NODE_ENV=test
// Loads DATABASE_URL from .env or uses test DB
// Initializes localStorage mock for frontend tests
// Clears all mocks after each test
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-session-secret-must-be-32-chars!!';

afterEach(() => {
  vi.clearAllMocks();
});
```

**Known Test Failures (pre-existing):**
- `server/services/__tests__/notification.service.test.ts` - 3 tests fail (date-related issues, not caused by recent changes)
- `server/services/__tests__/password-reset.service.test.ts` - 1 test fails (DB constraint violation)

These are not your responsibility to fix unless explicitly asked.

---

*Testing analysis: 2026-02-19*
