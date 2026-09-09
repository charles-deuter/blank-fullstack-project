/**
 * Shared class lists for the field components.
 *
 * Each control pairs a @tailwindcss/forms class (`form-input`, `form-select`, …)
 * with these utilities. The plugin class carries structure only — appearance reset,
 * consistent padding, the checkbox checkmark and select chevron SVGs — and hardcodes
 * a white background that the utilities below repaint. Both sit in Tailwind's
 * `utilities` layer, and the plugin's classes are emitted first, so the utilities
 * win the specificity tie.
 *
 * That same tie is why the valid and invalid variants are mutually exclusive rather
 * than layered: `border-edge` and `border-danger` have equal specificity, so listing
 * both would let emission order pick the winner regardless of the order they appear
 * in `className`. Never put two utilities for the same property on one control.
 */

/** Structure and the colors that do not vary with validity. */
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

/** Joins class names, dropping the falsy branches of conditionals. */
function joinClassnames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Classes for a text-like control (input, textarea, select).
 *
 * `extra` is appended last, but a utility there that targets a property already set
 * above wins or loses on emission order, not on position — override colors by
 * editing this file rather than by passing a competing class.
 */
export function textControlClasses(
  pluginClass: 'form-input' | 'form-textarea' | 'form-select',
  hasError: boolean,
  extra?: string,
): string {
  return joinClassnames(pluginClass, TEXT_BASE, hasError ? TEXT_INVALID : TEXT_VALID, extra);
}

/** Classes for a checkbox or radio. See `textControlClasses` on `extra`. */
export function toggleControlClasses(hasError: boolean, extra?: string): string {
  return joinClassnames(
    'form-checkbox',
    TOGGLE_BASE,
    hasError ? TOGGLE_INVALID : TOGGLE_VALID,
    extra,
  );
}
