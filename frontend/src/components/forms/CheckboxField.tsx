'use client';

import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import FieldError from './FieldError';
import { formCheckboxClasses } from './fieldStyles';

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  label: string;
  error?: string | null;
};

/**
 * Does not use FieldShell: a checkbox reads as control-then-label on one line,
 * where the text fields read as label-above-control.
 */
export default function CheckboxField({
  label,
  error,
  className,
  ...inputProps
}: CheckboxFieldProps) {
  const controlId = useId();
  const errorId = `${controlId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          {...inputProps}
          id={controlId}
          type="checkbox"
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
