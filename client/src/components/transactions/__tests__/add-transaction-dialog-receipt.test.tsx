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
    
    // Mock FileReader to resolve synchronously
    let onloadCallback: ((e: ProgressEvent) => void) | null = null;
    let fileReaderInstance: any = null;
    
    const FileReaderMock = vi.fn(function(this: any) {
      fileReaderInstance = this;
      this.result = null;
      this.onload = null;
      this.onerror = null;
      this.readAsDataURL = vi.fn((file: File) => {
        // Set result and trigger onload synchronously
        this.result = `data:image/jpeg;base64,${btoa('test')}`;
        if (this.onload) {
          // Use setTimeout to make it async but fast
          setTimeout(() => {
            this.onload({} as ProgressEvent);
          }, 10);
        }
      });
      return this;
    });
    
    global.FileReader = FileReaderMock as any;
    
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

    // Create a mock file and trigger upload
    const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
    
    // Create a FileList-like object using DataTransfer
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    
    // Trigger onChange event manually to simulate file upload
    const changeEvent = new Event('change', { bubbles: true });
    Object.defineProperty(changeEvent, 'target', {
      writable: false,
      value: fileInput,
    });
    fileInput.dispatchEvent(changeEvent);

    // Check that button shows loading state after upload
    // Wait for React to update the disabled state
    await waitFor(() => {
      expect(receiptButton).toBeDisabled();
    }, { timeout: 2000 });
    
    // Also verify that FileReader was called
    expect(FileReaderMock).toHaveBeenCalled();
  });

  it('should prefill form with receipt data on successful scan', async () => {
    const user = userEvent.setup();
    
    // Mock FileReader
    const FileReaderMock = vi.fn(function(this: any) {
      this.result = null;
      this.onload = null;
      this.onerror = null;
      this.readAsDataURL = vi.fn((file: File) => {
        this.result = `data:image/jpeg;base64,${btoa('test')}`;
        if (this.onload) {
          setTimeout(() => {
            this.onload({} as ProgressEvent);
          }, 10);
        }
      });
      return this;
    });
    
    global.FileReader = FileReaderMock as any;
    
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
    
    // Mock FileReader
    const FileReaderMock = vi.fn(function(this: any) {
      this.result = null;
      this.onload = null;
      this.onerror = null;
      this.readAsDataURL = vi.fn((file: File) => {
        this.result = `data:image/jpeg;base64,${btoa('test')}`;
        if (this.onload) {
          setTimeout(() => {
            this.onload({} as ProgressEvent);
          }, 10);
        }
      });
      return this;
    });
    
    global.FileReader = FileReaderMock as any;
    
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
    
    // Mock FileReader
    const FileReaderMock = vi.fn(function(this: any) {
      this.result = null;
      this.onload = null;
      this.onerror = null;
      this.readAsDataURL = vi.fn((file: File) => {
        this.result = `data:image/jpeg;base64,${btoa('test')}`;
        if (this.onload) {
          setTimeout(() => {
            this.onload({} as ProgressEvent);
          }, 10);
        }
      });
      return this;
    });
    
    global.FileReader = FileReaderMock as any;
    
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
