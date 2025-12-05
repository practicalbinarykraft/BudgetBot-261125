/**
 * UI Components Tests
 *
 * Tests for shadcn UI components to verify they render correctly.
 * These are simpler tests that don't require complex mocking.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import UI components directly - they don't need context providers
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ========================================
// BUTTON TESTS
// ========================================

describe('Button Component', () => {
  it('should render with children text', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    let clicked = false;

    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(clicked).toBe(true);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should render with default variant', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeInTheDocument();
  });

  it('should render with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeInTheDocument();
  });

  it('should render with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

// ========================================
// INPUT TESTS
// ========================================

describe('Input Component', () => {
  it('should render with placeholder', () => {
    render(<Input placeholder="Enter text" />);

    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should accept user input', async () => {
    const user = userEvent.setup();
    render(<Input data-testid="test-input" />);

    const input = screen.getByTestId('test-input');
    await user.type(input, 'Hello World');

    expect(input).toHaveValue('Hello World');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled data-testid="test-input" />);

    expect(screen.getByTestId('test-input')).toBeDisabled();
  });

  it('should render with type password', () => {
    render(<Input type="password" data-testid="test-input" />);

    expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'password');
  });

  it('should render with type email', () => {
    render(<Input type="email" data-testid="test-input" />);

    expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'email');
  });
});

// ========================================
// CARD TESTS
// ========================================

describe('Card Component', () => {
  it('should render card with children', () => {
    render(
      <Card data-testid="test-card">
        <CardContent>Card content</CardContent>
      </Card>
    );

    expect(screen.getByTestId('test-card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render card with header and title', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

// ========================================
// BADGE TESTS
// ========================================

describe('Badge Component', () => {
  it('should render badge with text', () => {
    render(<Badge>New</Badge>);

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should render with default variant', () => {
    render(<Badge data-testid="badge">Default</Badge>);

    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('should render with secondary variant', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);

    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('should render with destructive variant', () => {
    render(<Badge variant="destructive" data-testid="badge">Error</Badge>);

    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('should render with outline variant', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>);

    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });
});

// ========================================
// ACCESSIBILITY TESTS
// ========================================

describe('Accessibility', () => {
  it('Button should be keyboard accessible', async () => {
    const user = userEvent.setup();
    let clicked = false;

    render(<Button onClick={() => { clicked = true; }}>Click me</Button>);

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(clicked).toBe(true);
  });

  it('Input should be focusable', async () => {
    const user = userEvent.setup();
    render(<Input data-testid="test-input" />);

    const input = screen.getByTestId('test-input');
    await user.tab();

    expect(input).toHaveFocus();
  });
});
