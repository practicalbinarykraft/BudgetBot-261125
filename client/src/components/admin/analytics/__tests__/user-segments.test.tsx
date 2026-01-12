/**
 * UserSegments Component Tests
 *
 * TDD: Tests for UserSegments component
 * Junior-Friendly: Simple assertions, mock data
 */

import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '@/__tests__/test-utils';
import { UserSegments } from '../user-segments';
import type { UserSegment } from '@/lib/admin/mock-data/analytics.mock';

const mockSegments: UserSegment[] = [
  {
    name: 'New Users',
    description: 'Signed up in last 7 days',
    count: 87,
    criteria: 'signupDays <= 7',
  },
  {
    name: 'Activated',
    description: 'Created at least one transaction',
    count: 890,
    criteria: 'transactionsCount > 0',
  },
  {
    name: 'Power Users',
    description: 'High engagement, many transactions',
    count: 234,
    criteria: 'transactionsCount > 50 AND dau > 20',
  },
];

describe('UserSegments Component', () => {
  it('should render title and description', () => {
    render(<UserSegments segments={mockSegments} />, { wrapper: TestProviders });

    expect(screen.getByText('User Segments')).toBeInTheDocument();
    expect(screen.getByText('Pre-defined user groups for targeting')).toBeInTheDocument();
  });

  it('should render "Create Custom" button', () => {
    render(<UserSegments segments={mockSegments} />, { wrapper: TestProviders });

    expect(screen.getByText('Create Custom')).toBeInTheDocument();
  });

  it('should render all segments', () => {
    render(<UserSegments segments={mockSegments} />, { wrapper: TestProviders });

    expect(screen.getByText('New Users')).toBeInTheDocument();
    expect(screen.getByText('Activated')).toBeInTheDocument();
    expect(screen.getByText('Power Users')).toBeInTheDocument();
  });

  it('should render segment descriptions', () => {
    render(<UserSegments segments={mockSegments} />, { wrapper: TestProviders });

    expect(screen.getByText('Signed up in last 7 days')).toBeInTheDocument();
    expect(screen.getByText('Created at least one transaction')).toBeInTheDocument();
  });

  it('should render segment counts', () => {
    render(<UserSegments segments={mockSegments} />, { wrapper: TestProviders });

    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('890')).toBeInTheDocument();
    expect(screen.getByText('234')).toBeInTheDocument();
  });

  it('should render segment criteria', () => {
    render(<UserSegments segments={mockSegments} />, { wrapper: TestProviders });

    expect(screen.getByText('signupDays <= 7')).toBeInTheDocument();
    expect(screen.getByText('transactionsCount > 0')).toBeInTheDocument();
  });

  it('should handle empty segments array', () => {
    render(<UserSegments segments={[]} />, { wrapper: TestProviders });

    expect(screen.getByText('User Segments')).toBeInTheDocument();
    // Should not crash, just show empty grid
  });
});

