/**
 * Hooks for transaction data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Transaction, CreateTransactionInput, Stats, CategoryAnalytics, Category, PersonalTag, Budget } from '@/types';

/** Fetch transactions with optional filters */
export function useTransactions(filters?: {
  from?: string;
  to?: string;
  type?: string;
  categoryId?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.categoryId) params.append('categoryId', String(filters.categoryId));
  if (filters?.limit) params.append('limit', String(filters.limit));
  const qs = params.toString();
  const url = `/api/transactions${qs ? `?${qs}` : ''}`;

  return useQuery<Transaction[]>({
    queryKey: ['/api/transactions', filters],
    queryFn: () => apiRequest<Transaction[]>('GET', url),
  });
}

/** Fetch monthly stats */
export function useStats(from: string, to: string) {
  return useQuery<Stats>({
    queryKey: ['/api/stats', { from, to }],
    queryFn: () => apiRequest<Stats>('GET', `/api/stats?from=${from}&to=${to}`),
  });
}

/** Fetch category analytics */
export function useCategoryAnalytics(period: string = 'month') {
  return useQuery<CategoryAnalytics[]>({
    queryKey: ['/api/analytics/by-category', { period }],
    queryFn: () =>
      apiRequest<CategoryAnalytics[]>('GET', `/api/analytics/by-category?period=${period}`),
  });
}

/** Fetch categories */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest<Category[]>('GET', '/api/categories'),
  });
}

/** Fetch personal tags */
export function useTags() {
  return useQuery<PersonalTag[]>({
    queryKey: ['/api/tags'],
    queryFn: () => apiRequest<PersonalTag[]>('GET', '/api/tags'),
  });
}

/** Fetch budgets */
export function useBudgets() {
  return useQuery<Budget[]>({
    queryKey: ['/api/budgets'],
    queryFn: () => apiRequest<Budget[]>('GET', '/api/budgets'),
  });
}

/** Create a new transaction */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionInput) =>
      apiRequest<Transaction>('POST', '/api/transactions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/by-category'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
  });
}

/** Update an existing transaction */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTransactionInput> }) =>
      apiRequest<Transaction>('PATCH', `/api/transactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/by-category'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
  });
}

/** Delete a transaction */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/by-category'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
  });
}
