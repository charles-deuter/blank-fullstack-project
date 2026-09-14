'use client';

import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import FieldError from './FieldError';
import { formCheckboxClasses } from './fieldStyles';

type CheckboxFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'type' | 'value'
> & {
  label: string;
  error?: string | null;
  onValueChange?: (checked: boolean) => void;
  value?: boolean;
};

export default function CheckboxField({
  label,
  error,
  className,
  onValueChange,
  value,
  checked,
  ...inputProps
}: CheckboxFieldProps) {
  const controlId = useId();
  const errorId = `${controlId}-error`;
  const resolvedChecked = checked ?? value;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          {...inputProps}
          id={controlId}
          type="checkbox"
          checked={resolvedChecked}
          onChange={(e) => {
            onValueChange?.(e.target.checked);
            inputProps.onChange?.(e);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={formCheckboxClasses(Boolean(error), className)}
        />
        <label htmlFor={controlId} className="text-sm text-ink">
          {label}
        </label>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
