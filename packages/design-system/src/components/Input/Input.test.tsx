import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input.js';

describe('Input', () => {
  it('associates the visible label with the input', () => {
    render(<Input label="Email" placeholder="you@livraison.com" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'you@livraison.com');
  });

  it('renders helper text and links it via aria-describedby', () => {
    render(<Input label="API key" helperText="Generate from the developer portal." />);
    const input = screen.getByLabelText('API key');
    const helper = screen.getByText('Generate from the developer portal.');
    expect(input).toHaveAttribute('aria-describedby', helper.id);
  });

  it('reflects error state with aria-invalid and aria-errormessage', () => {
    render(<Input label="Recipient phone" error="Phone is invalid." />);
    const input = screen.getByLabelText('Recipient phone');
    const error = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(error).toHaveTextContent('Phone is invalid.');
    expect(input).toHaveAttribute('aria-errormessage', error.id);
  });

  it('forwards user input to onChange handlers (controlled)', async () => {
    const handleChange = vi.fn();
    render(<Input label="Search" value="" onChange={handleChange} />);
    const input = screen.getByLabelText('Search');
    await userEvent.type(input, 'A');
    expect(handleChange).toHaveBeenCalled();
  });

  it('marks the field as required visually and via the required attribute', () => {
    render(<Input label="Sender name" required />);
    const input = screen.getByLabelText(/Sender name/);
    expect(input).toBeRequired();
  });

  it('disables interaction when disabled', async () => {
    render(<Input label="Reference" disabled />);
    const input = screen.getByLabelText('Reference');
    expect(input).toBeDisabled();
    await userEvent.type(input, 'ignored');
    expect(input).toHaveValue('');
  });
});
