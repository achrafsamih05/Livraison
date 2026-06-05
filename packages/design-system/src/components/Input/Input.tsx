import {
  forwardRef,
  useId,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn.js';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Visual label rendered above the input. Always provide a label or
   * an explicit `aria-label` / `aria-labelledby` for accessibility.
   */
  label?: ReactNode;
  /**
   * Helper text shown below the input. Becomes the error message when
   * `error` is set, and is announced to screen readers via
   * `aria-describedby`.
   */
  helperText?: ReactNode;
  /**
   * Error message. When set, the input transitions to the error state and
   * `aria-invalid` is reflected for assistive technology.
   */
  error?: ReactNode;
  /**
   * Optional content rendered at the inline-start of the field
   * (currency symbol, search icon, country code, etc.).
   */
  leading?: ReactNode;
  /**
   * Optional content rendered at the inline-end of the field
   * (clear button, unit, status badge, etc.).
   */
  trailing?: ReactNode;
  /**
   * Visual size token. Heights map to the 8pt grid: sm 32, md 40, lg 48.
   */
  inputSize?: InputSize;
  /**
   * When true, the field expands to fill the available inline space.
   */
  fullWidth?: boolean;
}

const SIZE_TO_HEIGHT: Record<InputSize, string> = {
  sm: '32px',
  md: '40px',
  lg: '48px',
};

const SIZE_TO_FONT: Record<InputSize, string> = {
  sm: '14px',
  md: '14px',
  lg: '16px',
};

/**
 * Accessible text input with first-class label, helper, and error semantics.
 *
 * The component is designed to be used inside React Hook Form or any other
 * form library: it forwards the ref, supports controlled and uncontrolled
 * modes, and never owns its own value state.
 *
 * Accessibility:
 *   - Labels are always wired to the input via `htmlFor`/`id`.
 *   - Helper and error text are announced through `aria-describedby` and
 *     `aria-errormessage` respectively.
 *   - The error state surfaces through `aria-invalid="true"` so screen
 *     readers and validation libraries can react.
 *   - Focus rings use `--color-focus-ring` for a 3:1+ contrast outline.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    helperText,
    error,
    leading,
    trailing,
    inputSize = 'md',
    fullWidth = true,
    className,
    style,
    disabled,
    required,
    'aria-describedby': ariaDescribedByProp,
    'aria-errormessage': ariaErrorMessageProp,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const fieldId = id ?? `lv-input-${reactId}`;
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  const hasError = error !== undefined && error !== null && error !== false;
  const describedBy =
    [
      helperText !== undefined && helperText !== null ? helperId : undefined,
      hasError ? errorId : undefined,
      ariaDescribedByProp,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const wrapperStyle: CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    width: fullWidth ? '100%' : 'auto',
    gap: '4px',
    fontFamily: 'var(--font-family-primary)',
  };

  const labelStyle: CSSProperties = {
    color: 'var(--color-text)',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
  };

  const fieldShellStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height: SIZE_TO_HEIGHT[inputSize],
    width: fullWidth ? '100%' : 'auto',
    paddingInline: leading !== undefined || trailing !== undefined ? '12px' : '12px',
    backgroundColor: 'var(--color-surface)',
    border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border-strong)'}`,
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)',
    transition:
      'border-color var(--duration-fast) var(--easing-standard), box-shadow var(--duration-fast) var(--easing-standard)',
    opacity: disabled ? 0.6 : 1,
  };

  const inputStyle: CSSProperties = {
    flex: '1 1 auto',
    minWidth: 0,
    height: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: SIZE_TO_FONT[inputSize],
    lineHeight: 1.4,
  };

  const helperStyle: CSSProperties = {
    color: hasError ? 'var(--color-danger)' : 'var(--color-text-muted)',
    fontSize: '12px',
    lineHeight: '16px',
  };

  return (
    <div
      className={cn('lv-input-field', className)}
      style={{ ...wrapperStyle, ...style }}
      data-disabled={disabled || undefined}
      data-error={hasError || undefined}
    >
      {label !== undefined ? (
        <label htmlFor={fieldId} style={labelStyle}>
          {label}
          {required === true ? (
            <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>
              {' '}
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="lv-input-shell" style={fieldShellStyle}>
        {leading !== undefined ? (
          <span
            aria-hidden="true"
            style={{ display: 'inline-flex', color: 'var(--color-text-muted)' }}
          >
            {leading}
          </span>
        ) : null}
        <input
          ref={ref}
          id={fieldId}
          style={inputStyle}
          disabled={disabled}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          aria-errormessage={hasError ? (ariaErrorMessageProp ?? errorId) : undefined}
          {...rest}
        />
        {trailing !== undefined ? (
          <span style={{ display: 'inline-flex', color: 'var(--color-text-muted)' }}>
            {trailing}
          </span>
        ) : null}
      </div>

      {hasError ? (
        <span id={errorId} role="alert" style={helperStyle}>
          {error}
        </span>
      ) : helperText !== undefined && helperText !== null ? (
        <span id={helperId} style={helperStyle}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
