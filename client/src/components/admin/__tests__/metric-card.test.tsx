/**
 * MetricCard Component Tests
 *
 * TDD: Tests for MetricCard component
 * Junior-Friendly: Simple assertions, clear test names
 */

import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '@/__tests__/test-utils';
import { MetricCard } from '../dashboard/metric-card';

describe('MetricCard Component', () => {
  it('should render metric title and value', () => {
    render(
      <MetricCard
        title="Total Users"
        value={1250}
      />,
      { wrapper: TestProviders }
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <MetricCard
        title="MRR"
        value={5000}
        format="currency"
        description="Monthly recurring revenue"
      />,
      { wrapper: TestProviders }
    );

    expect(screen.getByText('Monthly recurring revenue')).toBeInTheDocument();
  });

  it('should format currency values', () => {
    render(
      <MetricCard
        title="MRR"
        value={5000}
        format="currency"
      />,
      { wrapper: TestProviders }
    );

    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('should format percentage values', () => {
    render(
      <MetricCard
        title="Growth"
        value={12.5}
        format="percentage"
      />,
      { wrapper: TestProviders }
    );

    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });

  it('should render trend up with positive change', () => {
    render(
      <MetricCard
        title="Growth"
        value={1250}
        change={12.5}
      />,
      { wrapper: TestProviders }
    );

    expect(screen.getByText('+12.5% from last month')).toBeInTheDocument();
  });

  it('should render trend down with negative change', () => {
    render(
      <MetricCard
        title="Churn"
        value={50}
        change={-5.2}
      />,
      { wrapper: TestProviders }
    );

    expect(screen.getByText('-5.2% from last month')).toBeInTheDocument();
  });

  it('should render without trend when change not provided', () => {
    render(
      <MetricCard
        title="Total"
        value={100}
      />,
      { wrapper: TestProviders }
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    // Should not have trend text
    expect(screen.queryByText(/from last month/)).not.toBeInTheDocument();
  });

  it('should render sparkline when trend data provided', () => {
    const trendData = [100, 120, 110, 130, 125];
    render(
      <MetricCard
        title="Trend"
        value={125}
        trend={trendData}
      />,
      { wrapper: TestProviders }
    );

    // Sparkline should render bars
    const sparkline = screen.getByTitle('125');
    expect(sparkline).toBeInTheDocument();
  });
});

