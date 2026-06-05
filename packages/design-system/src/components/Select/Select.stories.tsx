import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select.js';

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
  parameters: { layout: 'padded' },
  args: {
    label: 'Service level',
    placeholder: 'Choose a service',
    options: [
      { value: 'same-day', label: 'Same-day' },
      { value: 'next-day', label: 'Next-day' },
      { value: 'standard', label: 'Standard' },
      { value: 'economy', label: 'Economy' },
    ],
    defaultValue: '',
  },
  argTypes: {
    selectSize: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const WithError: Story = {
  args: { error: 'Please choose a service level.' },
};

export const Grouped: Story = {
  args: {
    options: [
      {
        label: 'Domestic',
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'next-day', label: 'Next-day' },
        ],
      },
      {
        label: 'International',
        options: [
          { value: 'express', label: 'Express' },
          { value: 'economy', label: 'Economy' },
        ],
      },
    ],
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'next-day' },
};
