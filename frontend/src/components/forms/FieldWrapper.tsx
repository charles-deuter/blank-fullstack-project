import type { ReactNode } from 'react';
import FieldError from './FieldError';

type FieldWrapperProps = {
  /** Id of the control, so the label points at it. */
  controlId: string;
  /** Id the control names in aria-describedby. */
  errorId: string;
  label: string;
  error?: string | null;
  children: ReactNode;
};

/** Label-above-control layout shared by the text, textarea, and select fields. */
export default function FieldWrapper({
  controlId,
  errorId,
  label,
  error,
  children,
}: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={controlId} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
