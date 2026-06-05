import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
} from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '../../utils/cn.js';

/**
 * Tabs primitives backed by Radix UI for keyboard and screen-reader support.
 *
 * Layout:
 *   - The list renders horizontally by default.
 *   - Pass `orientation="vertical"` on the `Root` to switch axes; the trigger
 *     visual treatment adapts automatically.
 *
 * Composition:
 *   <Tabs.Root defaultValue="overview">
 *     <Tabs.List aria-label="Shipment sections">
 *       <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
 *       <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
 *     </Tabs.List>
 *     <Tabs.Content value="overview">…</Tabs.Content>
 *     <Tabs.Content value="timeline">…</Tabs.Content>
 *   </Tabs.Root>
 */

export const Root = RadixTabs.Root;

const LIST_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'stretch',
  gap: '4px',
  padding: '4px',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
};

const LIST_VERTICAL_STYLE: CSSProperties = {
  ...LIST_STYLE,
  flexDirection: 'column',
};

export const List = forwardRef<
  ElementRef<typeof RadixTabs.List>,
  ComponentPropsWithoutRef<typeof RadixTabs.List>
>(function List({ className, style, ...rest }, ref) {
  return (
    <RadixTabs.List
      ref={ref}
      className={cn('lv-tabs-list', className)}
      style={{ ...LIST_STYLE, ...style }}
      {...rest}
    />
  );
});
List.displayName = 'Tabs.List';

const TRIGGER_BASE_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '32px',
  paddingInline: '12px',
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-family-primary)',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition:
    'background-color var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard)',
  outline: 'none',
};

export interface TriggerProps extends ComponentPropsWithoutRef<typeof RadixTabs.Trigger> {}

export const Trigger = forwardRef<ElementRef<typeof RadixTabs.Trigger>, TriggerProps>(
  function Trigger({ className, style, ...rest }, ref) {
    return (
      <RadixTabs.Trigger
        ref={ref}
        className={cn('lv-tabs-trigger', className)}
        style={{ ...TRIGGER_BASE_STYLE, ...style }}
        {...rest}
      />
    );
  },
);
Trigger.displayName = 'Tabs.Trigger';

export const Content = forwardRef<
  ElementRef<typeof RadixTabs.Content>,
  ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(function Content({ className, style, ...rest }, ref) {
  return (
    <RadixTabs.Content
      ref={ref}
      className={cn('lv-tabs-content', className)}
      style={{
        outline: 'none',
        paddingBlockStart: '16px',
        ...style,
      }}
      {...rest}
    />
  );
});
Content.displayName = 'Tabs.Content';

/**
 * Visual rules that depend on the active state are applied via CSS attribute
 * selectors. The selectors below are intentionally scoped to the `lv-` class
 * names so consumers can override them safely without specificity tricks.
 */
export const TABS_DATA_STYLES = `
  .lv-tabs-trigger[data-state="active"] {
    background-color: var(--color-surface-elevated);
    color: var(--color-text);
  }
  .lv-tabs-trigger:hover:not([data-state="active"]) {
    background-color: var(--color-surface-elevated);
    color: var(--color-text);
  }
  .lv-tabs-trigger:focus-visible {
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
  .lv-tabs-list[data-orientation="vertical"] {
    flex-direction: column;
  }
` as const;

export const ListVertical = forwardRef<
  ElementRef<typeof RadixTabs.List>,
  ComponentPropsWithoutRef<typeof RadixTabs.List>
>(function ListVertical({ className, style, ...rest }, ref) {
  return (
    <RadixTabs.List
      ref={ref}
      className={cn('lv-tabs-list', className)}
      style={{ ...LIST_VERTICAL_STYLE, ...style }}
      {...rest}
    />
  );
});
ListVertical.displayName = 'Tabs.ListVertical';
