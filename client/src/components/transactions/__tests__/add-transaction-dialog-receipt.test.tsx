/**
 * Tests for Receipt Scanner Integration in AddTransactionDialog
 * 
 * Junior-Friendly:
 * - Tests receipt upload functionality
 * - Tests form prefill from receipt data
 * - Tests error handling
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTransactionDialog } from '../add-transaction-dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', name: 'Test User', telegramId: null, telegramUsername: null, createdAt: new Date() },
    isLoading: false,
    error: null,
  }),
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock useTranslation hook
vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useTranslateCategory hook
vi.mock('@/lib/category-translations', () => ({
  useTranslateCategory: () => (name: string) => name,
}));

// Mock CategoryCreateDialog component
vi.mock('@/components/categories/category-create-dialog', () => ({
  CategoryCreateDialog: () => null,
}));

// Mock VoiceRecorderAdaptive component
vi.mock('@/components/voice-recorder-adaptive', () => ({
  VoiceRecorderAdaptive: () => null,
}));

// Mock TagSelector component
vi.mock('@/components/tags/tag-selector', () => ({
  TagSelector: () => null,
}));

// Mock apiRequest to avoid actual API calls
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

describe('AddTransactionDialog - Receipt Scanner', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
          queryFn: async ({ queryKey }) => {
            // Return empty arrays for categories and tags
            if (queryKey[0] === '/api/categories' || queryKey[0] === '/api/tags') {
              return [];
            }
            return null;
          },
        },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should render receipt scan button', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AddTransactionDialog open={true} onOpenChange={vi.fn()} />
      </QueryClientProvider>
    );

    const receiptButton = screen.getByTestId('button-scan-receipt');
    expect(receiptButton).toBeInTheDocument();
  });

  it('should show loading state when scanning receipt', async () => {
    const user = userEvent.setup();
    
    // Mock FileReader to resolve immediately
    const mockFileReader = {
      readAsDataURL: vi.fn(function(this: FileReader, file: File) {
        // Simulate async FileReader behavior
        setTimeout(() => {
          if (this.onload) {
            this.result = `data:image/jpeg;base64,${btoa('test')}`;
            this.onload({} as ProgressEvent);
          }
        }, 0);
      }),
      result: null,
      onload: null as ((e: ProgressEvent) => void) | null,
      onerror: null as ((e: ProgressEvent) => void) | null,
    };
    
    // Replace FileReader with mock
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    // Mock successful receipt scan
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        receipt: {
          total: 100,
          merchant: 'Test Store',
          date: '2025-01-15',
          currency: 'USD',
          items: [],
        },
        itemsCount: 0,
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AddTransactionDialog open={true} onOpenChange={vi.fn()} />
      </QueryClientProvider>
    );

    const receiptButton = screen.getByTestId('button-scan-receipt');
    const fileInput = screen.getByTestId('input-receipt-file') as HTMLInputElement;

    // Create a mock file
    const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
    
    await user.upload(fileInput, file);

    // Check that button shows loading state - wait for FileReader to trigger
    await waitFor(() => {
      expect(receiptButton).toBeDisabled();
    }, { timeout: 2000 });
  });

  it('should prefill form with receipt data on successful scan', async () => {
    const user = userEvent.setup();
    
    // Mock FileReader to resolve immediately
    const mockFileReader = {
      readAsDataURL: vi.fn(function(this: FileReader, file: File) {
        setTimeout(() => {
          if (this.onload) {
            this.result = `data:image/jpeg;base64,${btoa('test')}`;
            this.onload({} as ProgressEvent);
          }
        }, 0);
      }),
      result: null,
      onload: null as ((e: ProgressEvent) => void) | null,
      onerror: null as ((e: ProgressEvent) => void) | null,
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    // Mock successful receipt scan
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        receipt: {
          total: 150.50,
          merchant: 'Grocery Store',
          date: '2025-01-15',
          currency: 'USD',
          items: [],
        },
        itemsCount: 0,
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AddTransactionDialog open={true} onOpenChange={vi.fn()} />
      </QueryClientProvider>
    );

    const fileInput = screen.getByTestId('input-receipt-file') as HTMLInputElement;
    const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
    
    await user.upload(fileInput, file);

    // Wait for form to be prefilled
    await waitFor(() => {
      const descriptionInput = screen.getByTestId('input-description') as HTMLInputElement;
      const amountInput = screen.getByTestId('input-amount') as HTMLInputElement;
      
      expect(descriptionInput.value).toBe('Grocery Store');
      expect(amountInput.value).toBe('150.5');
    }, { timeout: 3000 });
  });

  it('should handle receipt scan error', async () => {
    const user = userEvent.setup();
    
    // Mock FileReader to resolve immediately
    const mockFileReader = {
      readAsDataURL: vi.fn(function(this: FileReader, file: File) {
        setTimeout(() => {
          if (this.onload) {
            this.result = `data:image/jpeg;base64,${btoa('test')}`;
            this.onload({} as ProgressEvent);
          }
        }, 0);
      }),
      result: null,
      onload: null as ((e: ProgressEvent) => void) | null,
      onerror: null as ((e: ProgressEvent) => void) | null,
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    // Mock error response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Failed to parse receipt',
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AddTransactionDialog open={true} onOpenChange={vi.fn()} />
      </QueryClientProvider>
    );

    const fileInput = screen.getByTestId('input-receipt-file') as HTMLInputElement;
    const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
    
    await user.upload(fileInput, file);

    // Wait for error handling
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should set transaction type to expense when scanning receipt', async () => {
    const user = userEvent.setup();
    
    // Mock FileReader to resolve immediately
    const mockFileReader = {
      readAsDataURL: vi.fn(function(this: FileReader, file: File) {
        setTimeout(() => {
          if (this.onload) {
            this.result = `data:image/jpeg;base64,${btoa('test')}`;
            this.onload({} as ProgressEvent);
          }
        }, 0);
      }),
      result: null,
      onload: null as ((e: ProgressEvent) => void) | null,
      onerror: null as ((e: ProgressEvent) => void) | null,
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    // Mock successful receipt scan
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        receipt: {
          total: 100,
          merchant: 'Test Store',
          date: '2025-01-15',
          currency: 'USD',
          items: [],
        },
        itemsCount: 0,
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AddTransactionDialog open={true} onOpenChange={vi.fn()} />
      </QueryClientProvider>
    );

    const fileInput = screen.getByTestId('input-receipt-file') as HTMLInputElement;
    const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
    
    await user.upload(fileInput, file);

    // Wait for form to be prefilled
    await waitFor(() => {
      const typeSelect = screen.getByTestId('select-type');
      expect(typeSelect).toHaveTextContent('expense');
    }, { timeout: 3000 });
  });
});
