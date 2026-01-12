/**
 * Admin Dashboard Page Tests
 *
 * TDD: Tests for AdminDashboardPage
 * Junior-Friendly: Simple assertions, mock API calls
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboardPage from '../../dashboard/index';
import { adminApi } from '@/lib/admin/api/admin-api';

// Mock the admin API
vi.mock('@/lib/admin/api/admin-api', () => ({
  adminApi: {
    getHeroMetrics: vi.fn(),
    getRevenueMetrics: vi.fn(),
    getGrowthMetrics: vi.fn(),
  },
}));

describe('AdminDashboardPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should render page title', () => {
    (adminApi.getHeroMetrics as any).mockResolvedValue({
      totalUsers: 1250,
      activeUsers: 890,
      mrr: 5000,
      churnRate: 2.5,
    });
    (adminApi.getRevenueMetrics as any).mockResolvedValue({
      mrr: 5000,
      arr: 60000,
      ltv: 299.70,
      cac: 45.50,
    });
    (adminApi.getGrowthMetrics as any).mockResolvedValue({
      newUsers: 87,
      churnedUsers: 12,
      reactivatedUsers: 5,
      netGrowth: 80,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    (adminApi.getHeroMetrics as any).mockImplementation(() => new Promise(() => {}));
    (adminApi.getRevenueMetrics as any).mockImplementation(() => new Promise(() => {}));
    (adminApi.getGrowthMetrics as any).mockImplementation(() => new Promise(() => {}));

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>
    );

    // Should show skeleton loaders
    const skeletons = screen.getAllByTestId(/skeleton/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render hero metrics when loaded', async () => {
    (adminApi.getHeroMetrics as any).mockResolvedValue({
      totalUsers: 1250,
      activeUsers: 890,
      mrr: 5000,
      churnRate: 2.5,
    });
    (adminApi.getRevenueMetrics as any).mockResolvedValue({
      mrr: 5000,
      arr: 60000,
      ltv: 299.70,
      cac: 45.50,
    });
    (adminApi.getGrowthMetrics as any).mockResolvedValue({
      newUsers: 87,
      churnedUsers: 12,
      reactivatedUsers: 5,
      netGrowth: 80,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument(); // totalUsers
    });
  });

  it('should render revenue metrics when loaded', async () => {
    (adminApi.getHeroMetrics as any).mockResolvedValue({
      totalUsers: 1250,
      activeUsers: 890,
      mrr: 5000,
      churnRate: 2.5,
    });
    (adminApi.getRevenueMetrics as any).mockResolvedValue({
      mrr: 5000,
      arr: 60000,
      ltv: 299.70,
      cac: 45.50,
    });
    (adminApi.getGrowthMetrics as any).mockResolvedValue({
      newUsers: 87,
      churnedUsers: 12,
      reactivatedUsers: 5,
      netGrowth: 80,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('$5,000')).toBeInTheDocument(); // MRR
    });
  });
});

