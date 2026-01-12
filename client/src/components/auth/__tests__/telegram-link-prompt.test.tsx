/**
 * TelegramLinkPrompt Component Tests
 *
 * Tests for Telegram linking prompt dialog
 * Junior-Friendly: ~80 lines, clear test cases
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/__tests__/test-utils';
import { TelegramLinkPrompt } from '../telegram-link-prompt';

// Setup DOM environment for tests
beforeEach(() => {
  document.body.innerHTML = '';
});

describe('TelegramLinkPrompt', () => {
  it('should render when open', () => {
    // Arrange
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    // Act
    renderWithProviders(
      <TelegramLinkPrompt
        open={true}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Assert
    expect(screen.getByText('Синхронизировать с Telegram?')).toBeInTheDocument();
    expect(screen.getByText(/В следующий раз вы сможете войти автоматически/)).toBeInTheDocument();
    expect(screen.getByText('Да, синхронизировать')).toBeInTheDocument();
    expect(screen.getByText('Позже')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    // Arrange
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    // Act
    renderWithProviders(
      <TelegramLinkPrompt
        open={false}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Assert
    expect(screen.queryByText('Синхронизировать с Telegram?')).not.toBeInTheDocument();
  });

  it('should call onAccept when "Да, синхронизировать" is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    renderWithProviders(
      <TelegramLinkPrompt
        open={true}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Act
    const acceptButton = screen.getByText('Да, синхронизировать');
    await user.click(acceptButton);

    // Assert
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onDecline).not.toHaveBeenCalled();
  });

  it('should call onDecline when "Позже" is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    renderWithProviders(
      <TelegramLinkPrompt
        open={true}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Act
    const declineButton = screen.getByText('Позже');
    await user.click(declineButton);

    // Assert
    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });
});

