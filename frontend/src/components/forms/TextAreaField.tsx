'use client';

import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import FieldWrapper from './FieldWrapper';
import { formTextAreaClasses } from './fieldStyles';

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string;
  error?: string | null;
  onValueChange?: (value: string) => void;
};

export default function TextAreaField({
  label,
  error,
  className,
  rows = 4,
  onValueChange,
  ...textareaProps
}: TextAreaFieldProps) {
  const controlId = useId();
  const errorId = `${controlId}-error`;

  return (
    <FieldWrapper controlId={controlId} errorId={errorId} label={label} error={error}>
      <textarea
        {...textareaProps}
        id={controlId}
        rows={rows}
        onChange={(e) => {
          onValueChange?.(e.target.value);
          textareaProps.onChange?.(e);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={formTextAreaClasses(Boolean(error), className)}
      />
    </FieldWrapper>
  );
}
