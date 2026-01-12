/**
 * FunnelChart Component Tests
 *
 * TDD: Tests for FunnelChart component
 * Junior-Friendly: Simple assertions, mock data
 */

import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '@/__tests__/test-utils';
import { FunnelChart } from '../funnel-chart';
import type { FunnelStep } from '@/lib/admin/mock-data/analytics.mock';

const mockFunnelData: FunnelStep[] = [
  {
    step: 'Landed on page',
    users: 10000,
    conversionRate: 100,
    dropoffRate: 0,
    avgTimeToNext: 0,
  },
  {
    step: 'Started signup',
    users: 5000,
    conversionRate: 50,
    dropoffRate: 50,
    avgTimeToNext: 0.1,
  },
  {
    step: 'Completed signup',
    users: 4000,
    conversionRate: 80,
    dropoffRate: 20,
    avgTimeToNext: 0.5,
  },
];

describe('FunnelChart Component', () => {
  it('should render chart title and description', () => {
    render(<FunnelChart data={mockFunnelData} />, { wrapper: TestProviders });

    expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
    expect(screen.getByText('User journey from landing to paid conversion')).toBeInTheDocument();
  });

  it('should render conversion rates section', () => {
    render(<FunnelChart data={mockFunnelData} />, { wrapper: TestProviders });

    expect(screen.getByText('Conversion Rates')).toBeInTheDocument();
  });

  it('should render conversion rate for each step transition', () => {
    render(<FunnelChart data={mockFunnelData} />, { wrapper: TestProviders });

    // Should show conversion from step 1 to step 2
    expect(screen.getByText(/Landed on page → Started signup/)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render average time to next step', () => {
    render(<FunnelChart data={mockFunnelData} />, { wrapper: TestProviders });

    // Should show time for step 2
    expect(screen.getByText('0.1h avg')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    render(<FunnelChart data={[]} />, { wrapper: TestProviders });

    expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
  });

  it('should render ResponsiveContainer for chart', () => {
    const { container } = render(<FunnelChart data={mockFunnelData} />, { wrapper: TestProviders });

    // Recharts ResponsiveContainer renders a div
    const chartContainer = container.querySelector('.recharts-responsive-container');
    expect(chartContainer).toBeInTheDocument();
  });
});

