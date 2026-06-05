import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button.js';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    a11y: { disable: false },
  },
  args: {
    children: 'Create shipment',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'link'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Cancel shipment' },
};

export const LinkVariant: Story = {
  args: { variant: 'link', children: 'View tracking' },
};

export const Loading: Story = {
  args: { loading: true, children: 'Saving' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Continue' },
  parameters: { layout: 'padded' },
};
