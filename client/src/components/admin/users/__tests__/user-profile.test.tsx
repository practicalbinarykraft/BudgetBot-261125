/**
 * UserProfile Component Tests
 *
 * TDD: Tests for UserProfile component
 * Junior-Friendly: Simple assertions, clear test names
 */

import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '@/__tests__/test-utils';
import { UserProfile } from '../user-profile';
import type { MockUser } from '@/lib/admin/api/admin-api';

const mockUser: MockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active',
  plan: 'pro',
  telegram: {
    id: '123456789',
    username: 'johndoe',
  },
  stage: 'activated',
  createdAt: new Date('2025-01-01'),
  daysSinceSignup: 45,
  transactionsCount: 150,
  lastActiveAt: new Date('2025-12-15'),
  mrr: 9.99,
  ltv: 299.70,
  totalSpent: 449.55,
  referralCode: 'JOHN2025',
  referredBy: null,
  referralsCount: 5,
};

describe('UserProfile Component', () => {
  it('should render user name and email', () => {
    render(<UserProfile user={mockUser} />, { wrapper: TestProviders });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should render user status badge', () => {
    render(<UserProfile user={mockUser} />, { wrapper: TestProviders });

    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should render user plan badge', () => {
    render(<UserProfile user={mockUser} />, { wrapper: TestProviders });

    expect(screen.getByText('pro')).toBeInTheDocument();
  });

  it('should render telegram information when linked', () => {
    render(<UserProfile user={mockUser} />, { wrapper: TestProviders });

    expect(screen.getByText(/@johndoe/)).toBeInTheDocument();
    expect(screen.getByText(/123456789/)).toBeInTheDocument();
  });

  it('should show "Not linked" when telegram is null', () => {
    const userWithoutTelegram = { ...mockUser, telegram: null };
    render(<UserProfile user={userWithoutTelegram} />, { wrapper: TestProviders });

    expect(screen.getByText('Not linked')).toBeInTheDocument();
  });

  it('should render transaction count', () => {
    render(<UserProfile user={mockUser} />, { wrapper: TestProviders });

    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should render MRR when greater than 0', () => {
    render(<UserProfile user={mockUser} />, { wrapper: TestProviders });

    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('should render LTV', () => {
    render(<UserProfile user={mockUser} />, { wrapper: TestProviders });

    expect(screen.getByText('$299.70')).toBeInTheDocument();
  });

  it('should render referral information when available', () => {
    render(<UserProfile user={mockUser} />, { wrapper: TestProviders });

    expect(screen.getByText('JOHN2025')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // referralsCount
  });

  it('should not render referral section when no referral data', () => {
    const userWithoutReferral = {
      ...mockUser,
      referralCode: null,
      referredBy: null,
      referralsCount: 0,
    };
    render(<UserProfile user={userWithoutReferral} />, { wrapper: TestProviders });

    // Referral section should not be visible
    expect(screen.queryByText('Referral')).not.toBeInTheDocument();
  });

  it('should render quick actions buttons', () => {
    render(<UserProfile user={mockUser} />, { wrapper: TestProviders });

    expect(screen.getByText('Edit Plan')).toBeInTheDocument();
    expect(screen.getByText('Send Email')).toBeInTheDocument();
    expect(screen.getByText('Send Telegram')).toBeInTheDocument();
    expect(screen.getByText('Grant Credits')).toBeInTheDocument();
  });

  it('should show "Block User" when status is not blocked', () => {
    render(<UserProfile user={mockUser} />, { wrapper: TestProviders });

    expect(screen.getByText('Block User')).toBeInTheDocument();
  });

  it('should show "Unblock" when status is blocked', () => {
    const blockedUser = { ...mockUser, status: 'blocked' as const };
    render(<UserProfile user={blockedUser} />, { wrapper: TestProviders });

    expect(screen.getByText('Unblock')).toBeInTheDocument();
  });
});

