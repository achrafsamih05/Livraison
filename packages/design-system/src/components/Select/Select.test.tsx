import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, type SelectOptions } from './Select.js';

const SERVICES: SelectOptions = [
  { value: 'same-day', label: 'Same-day' },
  { value: 'next-day', label: 'Next-day' },
  { value: 'standard', label: 'Standard' },
];

describe('Select', () => {
  it('renders the label and exposes options', () => {
    render(<Select label="Service" options={SERVICES} />);
    const select = screen.getByLabelText('Service');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('same-day');
  });

  it('renders a placeholder option when no value is selected', () => {
    render(
      <Select label="Service" options={SERVICES} placeholder="Choose a service" defaultValue="" />,
    );
    expect(screen.getByRole('option', { name: 'Choose a service' })).toBeDisabled();
  });

  it('reflects errors via aria-invalid and an alert role', () => {
    render(<Select label="Service" options={SERVICES} error="Pick a service." />);
    expect(screen.getByLabelText('Service')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a service.');
  });

  it('renders option groups when grouped options are provided', () => {
    render(
      <Select
        label="Service"
        options={[
          { label: 'Domestic', options: [{ value: 'standard', label: 'Standard' }] },
          { label: 'International', options: [{ value: 'express', label: 'Express' }] },
        ]}
      />,
    );
    expect(screen.getByRole('option', { name: 'Standard' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Express' })).toBeInTheDocument();
  });

  it('invokes onChange when the user selects an option', async () => {
    const handleChange = vi.fn();
    render(
      <Select label="Service" options={SERVICES} defaultValue="standard" onChange={handleChange} />,
    );
    const select = screen.getByLabelText('Service');
    await userEvent.selectOptions(select, 'next-day');
    expect(handleChange).toHaveBeenCalled();
    expect(select).toHaveValue('next-day');
  });
});
