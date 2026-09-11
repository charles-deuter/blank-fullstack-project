/**
 * Valid and invalid border variants are mutually exclusive — `border-edge` and
 * `border-danger` share specificity, so only one may appear on a control.
 */

const TEXT_BASE =
  'w-full rounded-md bg-elevated text-ink placeholder:text-muted ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const TEXT_VALID = 'border-edge focus:border-accent focus:ring-2 focus:ring-accent/40';

const TEXT_INVALID =
  'border-danger focus:border-danger focus:ring-2 focus:ring-danger/40';

const TOGGLE_BASE =
  'rounded bg-elevated text-accent focus:ring-2 focus:ring-offset-0 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const TOGGLE_VALID = 'border-edge focus:ring-accent/40';

const TOGGLE_INVALID = 'border-danger focus:ring-danger/40';

export function formInputClasses(hasError: boolean, extra?: string): string {
  return ['form-input', TEXT_BASE, hasError ? TEXT_INVALID : TEXT_VALID, extra]
    .filter(Boolean)
    .join(' ');
}

export function formTextAreaClasses(hasError: boolean, extra?: string): string {
  return ['form-textarea', TEXT_BASE, hasError ? TEXT_INVALID : TEXT_VALID, extra]
    .filter(Boolean)
    .join(' ');
}

export function formSelectClasses(hasError: boolean, extra?: string): string {
  return ['form-select', TEXT_BASE, hasError ? TEXT_INVALID : TEXT_VALID, extra]
    .filter(Boolean)
    .join(' ');
}

export function formCheckboxClasses(hasError: boolean, extra?: string): string {
  return ['form-checkbox', TOGGLE_BASE, hasError ? TOGGLE_INVALID : TOGGLE_VALID, extra]
    .filter(Boolean)
    .join(' ');
}
