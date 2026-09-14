'use client';

import { useId } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import FieldWrapper from './FieldWrapper';
import { formSelectClasses } from './fieldStyles';

export type ListboxFieldOption = {
  value: string;
  label: string;
};

type ListboxFieldProps = {
  label: string;
  error?: string | null;
  options: ListboxFieldOption[];
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
};

const resolveStyleVariants =
  (base: string, variants: { focus: string; selected: string; idle: string }) =>
  (state: { focus: boolean; selected: boolean }): string => {
    let variant = variants.idle;
    if (state.focus) {
      variant = variants.focus;
    } else if (state.selected) {
      variant = variants.selected;
    }
    return [base, variant].filter(Boolean).join(' ');
  };

export default function ListboxField({
  label,
  error,
  options,
  value,
  onChange,
  onValueChange,
  placeholder = 'Select an option',
  disabled = false,
  name,
  className,
}: ListboxFieldProps) {
  const handleChange = onValueChange ?? onChange;
  const controlId = useId();
  const errorId = `${controlId}-error`;

  const selectedOption = options.find((o) => o.value === value);

  return (
    <FieldWrapper controlId={controlId} errorId={errorId} label={label} error={error}>
      <Listbox
        value={value ?? ''}
        onChange={handleChange}
        disabled={disabled}
        name={name}
        invalid={Boolean(error)}
      >
        <div className="relative">
          <ListboxButton
            id={controlId}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={formSelectClasses(
              Boolean(error),
              `text-left ${!selectedOption ? 'text-muted' : ''} ${className ?? ''}`,
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </ListboxButton>

          <ListboxOptions
            transition
            className={
              'absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md py-1 ' +
              'bg-elevated border border-edge shadow-lg ' +
              'transition-opacity duration-150 ease-out data-[closed]:opacity-0'
            }
          >
            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                className={resolveStyleVariants('cursor-pointer select-none px-3 py-2', {
                  focus: 'bg-accent text-white',
                  selected: 'bg-accent/10 text-ink font-medium',
                  idle: 'text-ink',
                })}
              >
                {option.label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </FieldWrapper>
  );
}
