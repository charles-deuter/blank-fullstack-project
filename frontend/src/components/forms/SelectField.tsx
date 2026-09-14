'use client';

import { useId } from 'react';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import FieldWrapper from './FieldWrapper';
import { formSelectClasses } from './fieldStyles';

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string;
  error?: string | null;
  onValueChange?: (value: string) => void;
  children: ReactNode;
};

export default function SelectField({
  label,
  error,
  className,
  children,
  onValueChange,
  ...selectProps
}: SelectFieldProps) {
  const controlId = useId();
  const errorId = `${controlId}-error`;

  return (
    <FieldWrapper controlId={controlId} errorId={errorId} label={label} error={error}>
      <select
        {...selectProps}
        id={controlId}
        onChange={(e) => {
          onValueChange?.(e.target.value);
          selectProps.onChange?.(e);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={formSelectClasses(Boolean(error), className)}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}
