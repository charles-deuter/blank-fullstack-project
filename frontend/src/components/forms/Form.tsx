'use client';

import { type FormEvent, type ReactNode, useCallback, useState } from 'react';

type ValidatorFn<T> = (value: unknown, allValues: T) => string | null;

type FormMeta = {
  isSubmitting: boolean;
  formError: string | null;
  reset: () => void;
};

type StringFieldProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string) => void;
  onBlur: () => void;
  error: string | null;
  name: string;
  disabled: boolean;
};

type BooleanFieldProps = {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error: string | null;
  name: string;
  disabled: boolean;
};

type FieldProps<V> = V extends boolean ? BooleanFieldProps : StringFieldProps;

type FieldsOf<T> = {
  [K in keyof T]: FieldProps<T[K]>;
};

type FormProps<T extends Record<string, unknown>> = {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidatorFn<T>>>;
  onSubmit: (values: T) => Promise<string | null | undefined | void> | string | null | undefined | void;
  children: (fields: FieldsOf<T>, meta: FormMeta) => ReactNode;
};

export default function Form<T extends Record<string, unknown>>({
  initialValues,
  validationRules,
  onSubmit,
  children,
}: FormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validate = useCallback(
    (name: keyof T, value: unknown, allValues: T): string | null => {
      const rule = validationRules?.[name];
      if (!rule) return null;
      return rule(value, allValues);
    },
    [validationRules],
  );

  const validateAll = useCallback(
    (currentValues: T): Record<string, string | null> => {
      const result: Record<string, string | null> = {};
      for (const key of Object.keys(currentValues)) {
        result[key] = validate(key as keyof T, currentValues[key], currentValues);
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
      if (typeof result === 'string') {
        setFormError(result);
      } else {
        reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = {} as FieldsOf<T>;

  for (const key of Object.keys(initialValues) as Array<keyof T & string>) {
    const isBoolean = typeof initialValues[key] === 'boolean';
    const fieldError = (submitted || touched.has(key)) ? (errors[key] ?? null) : null;

    const onBlur = () => {
      setTouched((prev) => new Set(prev).add(key));
      const err = validate(key, values[key], values);
      setErrors((prev) => ({ ...prev, [key]: err }));
    };

    if (isBoolean) {
      (fields as Record<string, BooleanFieldProps>)[key] = {
        checked: values[key] as boolean,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          setValues((prev) => ({ ...prev, [key]: e.target.checked }));
        },
        onBlur,
        error: fieldError,
        name: key,
        disabled: isSubmitting,
      };
    } else {
      (fields as Record<string, StringFieldProps>)[key] = {
        value: (values[key] as string) ?? '',
        onChange: (
          e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string,
        ) => {
          const newValue = typeof e === 'string' ? e : e.target.value;
          setValues((prev) => ({ ...prev, [key]: newValue }));
        },
        onBlur,
        error: fieldError,
        name: key,
        disabled: isSubmitting,
      };
    }
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
