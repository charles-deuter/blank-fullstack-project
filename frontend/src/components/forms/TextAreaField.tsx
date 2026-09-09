'use client';

import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import FieldShell from './FieldShell';
import { textControlClasses } from './fieldStyles';

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string;
  error?: string | null;
};

export default function TextAreaField({
  label,
  error,
  className,
  rows = 4,
  ...textareaProps
}: TextAreaFieldProps) {
  const controlId = useId();
  const errorId = `${controlId}-error`;

  return (
    <FieldShell controlId={controlId} errorId={errorId} label={label} error={error}>
      <textarea
        {...textareaProps}
        id={controlId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={textControlClasses('form-textarea', Boolean(error), className)}
      />
    </FieldShell>
  );
}
