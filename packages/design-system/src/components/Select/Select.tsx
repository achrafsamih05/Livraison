import {
  forwardRef,
  useId,
  type CSSProperties,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn.js';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: ReadonlyArray<SelectOption>;
}

export type SelectOptions = ReadonlyArray<SelectOption | SelectOptionGroup>;

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children'> {
  /**
   * Visible label rendered above the field. If absent, callers must provide
   * `aria-label` or `aria-labelledby`.
   */
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  /**
   * Optional placeholder rendered as a disabled, selected first option when
   * the value is empty. Only applies when an empty `value` or `defaultValue`
   * is selected.
   */
  placeholder?: string;
  /**
   * Options for the field. Items may be plain options or grouped via
   * `SelectOptionGroup` to render `<optgroup>` elements.
   */
  options: SelectOptions;
  selectSize?: SelectSize;
  fullWidth?: boolean;
}

const SIZE_TO_HEIGHT: Record<SelectSize, string> = {
  sm: '32px',
  md: '40px',
  lg: '48px',
};

const SIZE_TO_FONT: Record<SelectSize, string> = {
  sm: '14px',
  md: '14px',
  lg: '16px',
};

function isOptionGroup(item: SelectOption | SelectOptionGroup): item is SelectOptionGroup {
  return (item as SelectOptionGroup).options !== undefined;
}

/**
 * Accessible single-select field built on the native `<select>` element.
 *
 * Native `<select>` is intentional: it inherits OS-level affordances on
 * mobile, supports keyboard search out of the box, and is robust under
 * assistive technologies. For complex multi-select or combobox patterns,
 * use `MultiSelect` or `ComboBox` (later sprints).
 *
 * Accessibility:
 *   - The label is associated via `htmlFor`/`id`.
 *   - Helper and error texts are exposed via `aria-describedby` and
 *     `aria-errormessage`.
 *   - Error state surfaces as `aria-invalid="true"`.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    id,
    label,
    helperText,
    error,
    placeholder,
    options,
    selectSize = 'md',
    fullWidth = true,
    className,
    style,
    disabled,
    required,
    value,
    defaultValue,
    'aria-describedby': ariaDescribedByProp,
    'aria-errormessage': ariaErrorMessageProp,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const fieldId = id ?? `lv-select-${reactId}`;
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

  const selectStyle: CSSProperties = {
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    height: SIZE_TO_HEIGHT[selectSize],
    width: fullWidth ? '100%' : 'auto',
    paddingInlineStart: '12px',
    paddingInlineEnd: '36px',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border-strong)'}`,
    borderRadius: 'var(--radius-md)',
    fontFamily: 'inherit',
    fontSize: SIZE_TO_FONT[selectSize],
    lineHeight: 1.4,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'><path d='M3 4.5L6 7.5L9 4.5' stroke='%23a1a1aa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '12px 12px',
  };

  const helperStyle: CSSProperties = {
    color: hasError ? 'var(--color-danger)' : 'var(--color-text-muted)',
    fontSize: '12px',
    lineHeight: '16px',
  };

  const showPlaceholder =
    placeholder !== undefined &&
    (value === '' || value === undefined) &&
    (defaultValue === '' || defaultValue === undefined);

  return (
    <div
      className={cn('lv-select-field', className)}
      style={{ ...wrapperStyle, ...style }}
      data-disabled={disabled || undefined}
      data-error={hasError || undefined}
    >
      {label !== undefined ? (
        <label
          htmlFor={fieldId}
          style={{
            color: 'var(--color-text)',
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: '20px',
          }}
        >
          {label}
          {required === true ? (
            <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>
              {' '}
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <select
        ref={ref}
        id={fieldId}
        style={selectStyle}
        disabled={disabled}
        required={required}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        aria-errormessage={hasError ? (ariaErrorMessageProp ?? errorId) : undefined}
        {...rest}
      >
        {showPlaceholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((item, index) => {
          if (isOptionGroup(item)) {
            return (
              <optgroup key={`grp-${index}-${item.label}`} label={item.label}>
                {item.options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            );
          }
          return (
            <option key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </option>
          );
        })}
      </select>

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

Select.displayName = 'Select';
