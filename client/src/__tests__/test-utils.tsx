/**
 * Frontend Test Utilities
 *
 * Junior-Friendly Guide:
 * =====================
 * This file provides helpers for testing React components.
 * Use TestProviders to wrap components that need context providers.
 *
 * Usage:
 *   import { render, screen } from '@testing-library/react';
 *   import { TestProviders } from './test-utils';
 *
 *   render(<MyComponent />, { wrapper: TestProviders });
 */

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthContext } from '@/hooks/use-auth';

// ========================================
// MOCK DATA
// ========================================

export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  telegramId: null,
  telegramUsername: null,
  createdAt: new Date(),
};

export const mockTranslations: Record<string, string> = {
  'auth.app_title': 'BudgetBot',
  'auth.app_description': 'Your personal finance assistant',
  'auth.login': 'Login',
  'auth.register': 'Register',
  'auth.welcome_back': 'Welcome back',
  'auth.create_account': 'Create account',
  'auth.login_description': 'Enter your credentials',
  'auth.register_description': 'Fill in your details',
  'auth.hero_title': 'Take Control of Your Finances',
  'auth.hero_subtitle': 'Track expenses, set budgets, achieve goals',
  'auth.feature_tracking': 'Expense tracking',
  'auth.feature_ai': 'AI-powered insights',
  'auth.feature_goals': 'Financial goals',
  'auth.feature_secure': 'Bank-grade security',
  'common.email': 'Email',
  'common.password': 'Password',
  'common.name': 'Name',
  'common.submit': 'Submit',
};

// ========================================
// MOCK PROVIDERS
// ========================================

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        queryFn: async ({ queryKey }) => {
          // Default queryFn для тестов - используем fetch
          const res = await fetch(queryKey.join("/") as string, {
            credentials: "include",
          });
          if (res.status === 401) return null;
          if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
          return res.json();
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Import the actual I18n context
import { I18nProvider } from '@/i18n/context';

// Используем реальный AuthContext, но создаем мокированные значения

interface MockAuthProviderProps {
  children: ReactNode;
  user?: typeof mockUser | null;
  isLoading?: boolean;
}

export const MockAuthProvider = ({
  children,
  user = null,
  isLoading = false,
}: MockAuthProviderProps) => {
  const mockAuthContext = {
    user,
    isLoading,
    error: null,
    loginMutation: {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    },
    logoutMutation: {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    },
    registerMutation: {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    },
  };

  return (
    <AuthContext.Provider value={mockAuthContext as any}>
      {children}
    </AuthContext.Provider>
  );
};

// ========================================
// TEST PROVIDERS
// ========================================

interface TestProvidersProps {
  children: ReactNode;
  user?: typeof mockUser | null;
  isLoading?: boolean;
}

export function TestProviders({
  children,
  user = null,
  isLoading = false,
}: TestProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <MockAuthProvider user={user} isLoading={isLoading}>
          {children}
        </MockAuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

// ========================================
// CUSTOM RENDER
// ========================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: typeof mockUser | null;
  isLoading?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { user, isLoading, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders user={user} isLoading={isLoading}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
