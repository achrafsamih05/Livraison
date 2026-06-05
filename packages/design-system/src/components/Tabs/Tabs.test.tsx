import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Tabs from './Tabs.js';

describe('Tabs', () => {
  function renderTabs(): void {
    render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List aria-label="Shipment sections">
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
          <Tabs.Trigger value="documents" disabled>
            Documents
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">Overview content</Tabs.Content>
        <Tabs.Content value="timeline">Timeline content</Tabs.Content>
        <Tabs.Content value="documents">Documents content</Tabs.Content>
      </Tabs.Root>,
    );
  }

  it('renders the default tab as active and exposes proper roles', () => {
    renderTabs();
    expect(screen.getByRole('tablist', { name: 'Shipment sections' })).toBeInTheDocument();
    const overview = screen.getByRole('tab', { name: 'Overview' });
    expect(overview).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Overview' })).toHaveTextContent(
      'Overview content',
    );
  });

  it('switches tab on click and reflects the change in aria-selected', async () => {
    renderTabs();
    await userEvent.click(screen.getByRole('tab', { name: 'Timeline' }));
    expect(screen.getByRole('tab', { name: 'Timeline' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: 'Timeline' })).toHaveTextContent(
      'Timeline content',
    );
  });

  it('supports keyboard navigation with arrow keys', async () => {
    renderTabs();
    const overview = screen.getByRole('tab', { name: 'Overview' });
    overview.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Timeline' })).toHaveFocus();
  });

  it('skips disabled tabs in keyboard navigation', async () => {
    renderTabs();
    const timeline = screen.getByRole('tab', { name: 'Timeline' });
    timeline.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
  });
});
