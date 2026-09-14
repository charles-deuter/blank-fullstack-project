'use client';

import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import FieldWrapper from './FieldWrapper';
import { formInputClasses } from './fieldStyles';

/** The input types @tailwindcss/forms styles as text-like. */
type TextInputType =
  'text' | 'email' | 'password' | 'url' | 'tel' | 'search' | 'number' | 'date' | 'time';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  label: string;
  error?: string | null;
  type?: TextInputType;
  onValueChange?: (value: string) => void;
};

export default function TextField({
  label,
  error,
  type = 'text',
  className,
  onValueChange,
  ...inputProps
}: TextFieldProps) {
  const controlId = useId();
  const errorId = `${controlId}-error`;

  return (
    <FieldWrapper controlId={controlId} errorId={errorId} label={label} error={error}>
      <input
        {...inputProps}
        id={controlId}
        type={type}
        onChange={(e) => {
          onValueChange?.(e.target.value);
          inputProps.onChange?.(e);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={formInputClasses(Boolean(error), className)}
      />
    </FieldWrapper>
  );
}
