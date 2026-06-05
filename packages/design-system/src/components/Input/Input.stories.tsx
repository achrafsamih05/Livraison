import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input.js';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  parameters: { layout: 'padded' },
  args: {
    label: 'Recipient email',
    placeholder: 'you@example.com',
  },
  argTypes: {
    inputSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithHelperText: Story = {
  args: { helperText: 'We will only contact this email about the shipment.' },
};

export const WithError: Story = {
  args: { error: 'A valid email is required.' },
};

export const WithLeadingAndTrailing: Story = {
  args: {
    label: 'AWB',
    leading: '#',
    trailing: 'SA',
    placeholder: '1234567890',
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'noreply@livraison.com' },
};

export const Required: Story = {
  args: { required: true },
};
