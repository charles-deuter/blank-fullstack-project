'use client';

import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import FieldShell from './FieldShell';
import { textControlClasses } from './fieldStyles';

/** The input types @tailwindcss/forms styles as text-like. */
type TextInputType =
  'text' | 'email' | 'password' | 'url' | 'tel' | 'search' | 'number' | 'date' | 'time';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  label: string;
  /** Validation message. Sets aria-invalid and the danger border when present. */
  error?: string | null;
  type?: TextInputType;
};

export default function TextField({
  label,
  error,
  type = 'text',
  className,
  ...inputProps
}: TextFieldProps) {
  const controlId = useId();
  const errorId = `${controlId}-error`;

  return (
    <FieldShell controlId={controlId} errorId={errorId} label={label} error={error}>
      <input
        {...inputProps}
        id={controlId}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={textControlClasses('form-input', Boolean(error), className)}
      />
    </FieldShell>
  );
}
