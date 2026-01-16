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
        isMiniApp={true}
      />
    );

    // Assert - компонент использует переводы, проверяем по ключам или переводам
    expect(screen.getByText(/Sync with Telegram|Синхронизировать с Telegram/i)).toBeInTheDocument();
    expect(screen.getByText(/Next time|В следующий раз/i)).toBeInTheDocument();
    expect(screen.getByText(/Yes, sync|Да, синхронизировать/i)).toBeInTheDocument();
    expect(screen.getByText(/Later|Позже/i)).toBeInTheDocument();
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
        isMiniApp={true}
      />
    );

    // Assert
    expect(screen.queryByText(/Sync with Telegram|Синхронизировать с Telegram/i)).not.toBeInTheDocument();
  });

  it('should call onAccept when "Yes, sync" button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    renderWithProviders(
      <TelegramLinkPrompt
        open={true}
        onAccept={onAccept}
        onDecline={onDecline}
        isMiniApp={true}
      />
    );

    // Act - кнопка появляется только для Mini App
    const acceptButton = screen.getByText(/Yes, sync|Да, синхронизировать/i);
    await user.click(acceptButton);

    // Assert
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onDecline).not.toHaveBeenCalled();
  });

  it('should call onDecline when "Later" button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    renderWithProviders(
      <TelegramLinkPrompt
        open={true}
        onAccept={onAccept}
        onDecline={onDecline}
        isMiniApp={true}
      />
    );

    // Act
    const declineButton = screen.getByText(/Later|Позже/i);
    await user.click(declineButton);

    // Assert
    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });
});

