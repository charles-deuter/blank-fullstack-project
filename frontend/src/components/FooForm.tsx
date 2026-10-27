'use client';

import Form from './forms/Form';
import TextField from './forms/TextField';
import TextAreaField from './forms/TextAreaField';
import SelectField from './forms/SelectField';
import ListboxField, { type ListboxFieldOption } from './forms/ListboxField';
import CheckboxField from './forms/CheckboxField';
import type { CreateFooInput, FooCategory, FooPriority } from '@/server-actions/foo';

const DESCRIPTION_MAX_LENGTH = 500;

// Messages match the backend's 400 bodies byte for byte, so a field reads the same
// whether the browser or the server caught the problem.
const MESSAGES = {
  name: 'name is required and must be a non-empty string',
  description: 'description must be a string of at most 500 characters',
  category: 'category is required and must be one of general, internal, external',
  priority: 'priority is required and must be one of low, medium, high',
};

const CATEGORY_OPTIONS: { value: FooCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
];

const PRIORITY_OPTIONS: (ListboxFieldOption & { value: FooPriority })[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// The select and listbox hold plain strings, with '' meaning nothing picked yet.
type FooFormValues = {
  name: string;
  description: string;
  category: string;
  priority: string;
  is_active: boolean;
};

// Module scope so the identity is stable: Form's reset() restores this object.
const INITIAL_VALUES: FooFormValues = {
  name: '',
  description: '',
  category: '',
  priority: '',
  is_active: true,
};

function isFooCategory(value: unknown): value is FooCategory {
  return CATEGORY_OPTIONS.some((option) => option.value === value);
}

function isFooPriority(value: unknown): value is FooPriority {
  return PRIORITY_OPTIONS.some((option) => option.value === value);
}

const VALIDATION_RULES = {
  name: (value: unknown) => {
    const isNonBlank = typeof value === 'string' && value.trim() !== '';
    return isNonBlank ? null : MESSAGES.name;
  },
  description: (value: unknown) => {
    const isWithinLimit =
      typeof value === 'string' && value.trim().length <= DESCRIPTION_MAX_LENGTH;
    return isWithinLimit ? null : MESSAGES.description;
  },
  category: (value: unknown) => (isFooCategory(value) ? null : MESSAGES.category),
  priority: (value: unknown) => (isFooPriority(value) ? null : MESSAGES.priority),
};

type FooFormProps = {
  /** Resolves to a form-level error message, or null on success (the form then resets). */
  onSubmit: (values: CreateFooInput) => Promise<string | null>;
};

export default function FooForm({ onSubmit }: FooFormProps) {
  async function handleSubmit(values: FooFormValues): Promise<string | null> {
    const { category, priority } = values;

    // Form only calls this once every rule passes, so these guards narrow the types
    // rather than catch anything a user can reach.
    if (!isFooCategory(category)) return MESSAGES.category;
    if (!isFooPriority(priority)) return MESSAGES.priority;

    return onSubmit({ ...values, category, priority });
  }

  return (
    <Form
      initialValues={INITIAL_VALUES}
      validationRules={VALIDATION_RULES}
      onSubmit={handleSubmit}
    >
      {(fields, meta) => (
        <div className="flex flex-col gap-3">
          <TextField label="Name" {...fields.name} />
          <TextAreaField label="Description" rows={3} {...fields.description} />
          <SelectField label="Category" {...fields.category}>
            <option value="" disabled>
              Select a category
            </option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <ListboxField
            label="Priority"
            options={PRIORITY_OPTIONS}
            placeholder="Select a priority"
            {...fields.priority}
          />
          <CheckboxField label="Active" {...fields.is_active} />
          <button
            type="submit"
            disabled={meta.isSubmitting}
            className="self-start rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {meta.isSubmitting ? 'Creating…' : 'Create foo'}
          </button>
        </div>
      )}
    </Form>
  );
}
