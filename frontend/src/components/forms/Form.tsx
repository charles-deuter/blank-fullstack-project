'use client';

import { type FormEvent, type ReactNode, useCallback, useState } from 'react';

type FormField<TValue> = {
  value: TValue;
  onValueChange: (newValue: TValue) => void;
  onBlur: () => void;
  error: string | null;
  name: string;
  disabled: boolean;
};

type FormMeta = {
  isSubmitting: boolean;
  formError: string | null;
  reset: () => void;
};

type FormProps<TValues extends Record<string, unknown>> = {
  initialValues: TValues;
  validationRules?: Partial<
    Record<keyof TValues, (value: unknown, allValues: TValues) => string | null>
  >;
  onSubmit: (values: TValues) => Promise<string | null | void>;
  children: (
    fields: { [TKey in keyof TValues]: FormField<TValues[TKey]> },
    meta: FormMeta,
  ) => ReactNode;
};

export default function Form<TValues extends Record<string, unknown>>({
  initialValues,
  validationRules,
  onSubmit,
  children,
}: FormProps<TValues>) {
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validate = useCallback(
    (name: string, value: unknown, allValues: TValues): string | null => {
      const rule = validationRules?.[name];
      if (!rule) return null;
      return rule(value, allValues);
    },
    [validationRules],
  );

  const validateAll = useCallback(
    (currentValues: TValues): Record<string, string | null> => {
      const result: Record<string, string | null> = {};
      for (const key of Object.keys(currentValues)) {
        result[key] = validate(key, currentValues[key], currentValues);
      }
      return result;
    },
    [validate],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched(new Set());
    setSubmitted(false);
    setFormError(null);
  }, [initialValues]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const allErrors = validateAll(values);
    setErrors(allErrors);
    setSubmitted(true);

    const hasErrors = Object.values(allErrors).some((err) => err !== null);
    if (hasErrors) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await onSubmit(values);
      if (result) {
        setFormError(result);
      } else {
        reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = {} as { [TKey in keyof TValues]: FormField<TValues[TKey]> };

  for (const key of Object.keys(initialValues)) {
    const fieldError = (submitted || touched.has(key)) ? (errors[key] ?? null) : null;

    (fields as Record<string, FormField<unknown>>)[key] = {
      value: values[key],
      onValueChange: (newValue: unknown) => {
        setValues((prev) => ({ ...prev, [key]: newValue }));
      },
      onBlur: () => {
        setTouched((prev) => new Set(prev).add(key));
        const err = validate(key, values[key], values);
        setErrors((prev) => ({ ...prev, [key]: err }));
      },
      error: fieldError,
      name: key,
      disabled: isSubmitting,
    };
  }

  const meta: FormMeta = { isSubmitting, formError, reset };

  return (
    <form onSubmit={handleSubmit}>
      {children(fields, meta)}
      {formError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {formError}
        </p>
      )}
    </form>
  );
}
