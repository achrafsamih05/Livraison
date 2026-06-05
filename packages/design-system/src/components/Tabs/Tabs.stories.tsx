import type { Meta, StoryObj } from '@storybook/react';
import * as Tabs from './Tabs.js';

const meta: Meta = {
  title: 'Primitives/Tabs',
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj;

export const Horizontal: Story = {
  render: () => (
    <Tabs.Root defaultValue="overview">
      <Tabs.List aria-label="Shipment sections">
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
        <Tabs.Trigger value="pieces">Pieces</Tabs.Trigger>
        <Tabs.Trigger value="documents">Documents</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">Overview content for AWB EX1234567890SA.</Tabs.Content>
      <Tabs.Content value="timeline">Tracking timeline content.</Tabs.Content>
      <Tabs.Content value="pieces">Pieces content.</Tabs.Content>
      <Tabs.Content value="documents">Documents content.</Tabs.Content>
    </Tabs.Root>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs.Root defaultValue="overview" orientation="vertical" style={{ display: 'flex', gap: 16 }}>
      <Tabs.ListVertical aria-label="Settings">
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="security">Security</Tabs.Trigger>
        <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
      </Tabs.ListVertical>
      <div>
        <Tabs.Content value="overview">Overview content.</Tabs.Content>
        <Tabs.Content value="security">Security content.</Tabs.Content>
        <Tabs.Content value="billing">Billing content.</Tabs.Content>
      </div>
    </Tabs.Root>
  ),
};
