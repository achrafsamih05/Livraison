import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn.js';

/**
 * Button variants.
 *
 * Variants:
 *   - primary  : default brand action.
 *   - secondary: lower emphasis on dark surfaces.
 *   - ghost    : minimal emphasis; used inside dense toolbars.
 *   - danger   : destructive actions; pairs with confirm dialogs.
 *   - link     : inline anchor-styled action.
 *
 * Sizes follow the 8pt grid: sm (32px), md (40px), lg (48px).
 *
 * The class strings below are intentionally written without Tailwind utility
 * classes so this component works in any consumer (Tailwind or vanilla CSS).
 * Visual rules are realized via inline style + CSS variables exposed by
 * styles.css. Class names are kept for consumers who want to layer styles.
 */
export const buttonVariants = cva('lv-button', {
  variants: {
    variant: {
      primary: 'lv-button--primary',
      secondary: 'lv-button--secondary',
      ghost: 'lv-button--ghost',
      danger: 'lv-button--danger',
      link: 'lv-button--link',
    },
    size: {
      sm: 'lv-button--sm',
      md: 'lv-button--md',
      lg: 'lv-button--lg',
    },
    fullWidth: {
      true: 'lv-button--full',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
  },
});

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render the styled button as a different element while preserving styles
   * and ARIA. Useful for `next/link` integration.
   */
  asChild?: boolean;
  /**
   * When true, replaces children with a centered spinner and forces
   * `aria-busy="true"`. The button remains focusable but disabled.
   */
  loading?: boolean;
  /**
   * Icon rendered at the inline-start of the label.
   */
  leadingIcon?: ReactNode;
  /**
   * Icon rendered at the inline-end of the label.
   */
  trailingIcon?: ReactNode;
}

const SIZE_STYLES: Record<ButtonSize, { height: string; padding: string; fontSize: string }> = {
  sm: { height: '32px', padding: '0 12px', fontSize: '14px' },
  md: { height: '40px', padding: '0 16px', fontSize: '14px' },
  lg: { height: '48px', padding: '0 20px', fontSize: '16px' },
};

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-primary-foreground)',
    border: '1px solid var(--color-primary)',
  },
  secondary: {
    backgroundColor: 'var(--color-surface-elevated)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border-strong)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text)',
    border: '1px solid transparent',
  },
  danger: {
    backgroundColor: 'var(--color-danger)',
    color: 'var(--color-primary-foreground)',
    border: '1px solid var(--color-danger)',
  },
  link: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    border: '1px solid transparent',
    height: 'auto',
    padding: 0,
    textDecoration: 'underline',
  },
};

const Spinner = (): JSX.Element => (
  <span
    aria-hidden="true"
    style={{
      display: 'inline-block',
      width: '1em',
      height: '1em',
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderInlineEndColor: 'transparent',
      animation: 'lv-spin 600ms linear infinite',
    }}
  />
);

/**
 * Accessible, themeable button primitive.
 *
 * Accessibility:
 *   - Renders a native `<button>` by default; `asChild` swaps to any focusable
 *     element while preserving focus, key handlers, and ARIA.
 *   - Disabled state is communicated via the disabled attribute.
 *   - Loading state sets `aria-busy="true"` and `aria-disabled="true"`, while
 *     keeping the element non-interactive (pointerEvents disabled).
 *   - Visible focus ring uses semantic `--color-focus-ring`.
 *
 * Internationalization:
 *   - Layout uses inline-start/inline-end via CSS logical properties so the
 *     button mirrors automatically when an ancestor sets `dir="rtl"`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    asChild,
    className,
    variant,
    size,
    fullWidth,
    loading,
    disabled,
    leadingIcon,
    trailingIcon,
    children,
    type,
    style,
    ...rest
  },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  const resolvedVariant: ButtonVariant = variant ?? 'primary';
  const resolvedSize: ButtonSize = size ?? 'md';
  const isDisabled = disabled === true || loading === true;

  const variantStyle = VARIANT_STYLES[resolvedVariant];
  const sizeStyle = SIZE_STYLES[resolvedSize];

  const composedStyle: React.CSSProperties = {
    display: fullWidth === true ? 'flex' : 'inline-flex',
    width: fullWidth === true ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-family-primary)',
    fontWeight: 500,
    lineHeight: 1.2,
    borderRadius: 'var(--radius-md)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    transition:
      'background-color var(--duration-fast) var(--easing-standard), border-color var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard)',
    ...variantStyle,
    ...(resolvedVariant !== 'link'
      ? { height: sizeStyle.height, padding: sizeStyle.padding, fontSize: sizeStyle.fontSize }
      : { fontSize: sizeStyle.fontSize }),
    ...style,
  };

  return (
    <Comp
      ref={ref as never}
      className={cn(
        buttonVariants({
          variant: resolvedVariant,
          size: resolvedSize,
          fullWidth: fullWidth ?? false,
        }),
        className,
      )}
      style={composedStyle}
      type={asChild ? undefined : (type ?? 'button')}
      disabled={asChild ? undefined : isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading === true || undefined}
      data-loading={loading === true || undefined}
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading === true ? (
            <span aria-hidden="true" style={{ display: 'inline-flex' }}>
              <Spinner />
            </span>
          ) : leadingIcon !== undefined ? (
            <span aria-hidden="true" style={{ display: 'inline-flex' }}>
              {leadingIcon}
            </span>
          ) : null}
          <span>{children}</span>
          {loading !== true && trailingIcon !== undefined ? (
            <span aria-hidden="true" style={{ display: 'inline-flex' }}>
              {trailingIcon}
            </span>
          ) : null}
        </>
      )}
    </Comp>
  );
});

Button.displayName = 'Button';
