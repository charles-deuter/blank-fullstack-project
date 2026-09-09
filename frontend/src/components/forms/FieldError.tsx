type FieldErrorProps = {
  id: string;
  message: string | null | undefined;
};

/**
 * Inline validation message for a single field. Always rendered so the field does
 * not shift when a message appears, and announced politely rather than assertively
 * because messages surface on blur while the user is still working the form.
 */
export default function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p id={id} role="status" aria-live="polite" className="min-h-5 text-sm text-danger">
      {message}
    </p>
  );
}
