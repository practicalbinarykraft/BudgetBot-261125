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

// Mock useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1 },
  }),
}));

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock useTranslation hook
vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

// Mock useTranslateCategory hook
vi.mock('@/lib/category-translations', () => ({
  useTranslateCategory: () => (name: string) => name,
}));

// Mock useQuery hook - return empty arrays for categories and tags
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: [],
    })),
  };
});

describe('AddTransactionDialog - Receipt Scanner', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
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

    // Check that button shows loading state
    await waitFor(() => {
      expect(receiptButton).toBeDisabled();
    });
  });

  it('should prefill form with receipt data on successful scan', async () => {
    const user = userEvent.setup();
    
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
    });
  });

  it('should handle receipt scan error', async () => {
    const user = userEvent.setup();
    
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
    });
  });

  it('should set transaction type to expense when scanning receipt', async () => {
    const user = userEvent.setup();
    
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
    });
  });
});
