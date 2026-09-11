'use client';

import { useId } from 'react';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import FieldWrapper from './FieldWrapper';
import { formSelectClasses } from './fieldStyles';

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string;
  error?: string | null;
  /** The <option> elements. */
  children: ReactNode;
};

export default function SelectField({
  label,
  error,
  className,
  children,
  ...selectProps
}: SelectFieldProps) {
  const controlId = useId();
  const errorId = `${controlId}-error`;

  return (
    <FieldWrapper controlId={controlId} errorId={errorId} label={label} error={error}>
      <select
        {...selectProps}
        id={controlId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={formSelectClasses(Boolean(error), className)}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}
