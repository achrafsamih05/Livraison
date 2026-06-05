import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button.js';

describe('Button', () => {
  it('renders a native button with the children as accessible name', () => {
    render(<Button>Save changes</Button>);
    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('forwards refs to the underlying button element', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Action</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('invokes onClick when activated by mouse and keyboard', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it('does not invoke onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Disabled' }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('communicates loading state via aria-busy and suppresses interaction', async () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} loading>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('exposes the chosen variant and size as data attributes for styling and tests', () => {
    render(
      <Button variant="danger" size="lg">
        Remove
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Remove' });
    expect(button).toHaveAttribute('data-variant', 'danger');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('renders as a child element when asChild is set, preserving accessibility', () => {
    render(
      <Button asChild>
        <a href="/dashboard">Go to dashboard</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Go to dashboard' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });
});
