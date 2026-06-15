'use client';

import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { NumberFieldClientComponent, Validate } from 'payload';

import { TextInput, useField } from '@payloadcms/ui';

function adminWidth(field: { admin?: { width?: number | string } }) {
  return field.admin?.width;
}

function fieldClassName(field: { admin?: { className?: string } }) {
  return field.admin?.className;
}

function fieldPlaceholder(field: { admin?: { placeholder?: unknown } }) {
  const placeholder = field.admin?.placeholder;

  return typeof placeholder === 'string' ? placeholder : undefined;
}

export function formatThousands(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }

  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseFormattedNumber(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  return Number(digits);
}

export const CurriculumTuitionFeeField: NumberFieldClientComponent = ({
  field,
  path: pathFromProps,
  readOnly,
  validate,
}) => {
  const memoizedValidate = useCallback<Validate>(
    (fieldValue, options) => {
      if (typeof validate !== 'function') {
        return true;
      }

      return validate(fieldValue as number, options as never);
    },
    [validate],
  );
  const { disabled, path, setValue, showError, value } = useField<number | null>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  });
  const displayValue = formatThousands(value);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(parseFormattedNumber(event.target.value));
  }

  return (
    <TextInput
      className={fieldClassName(field)}
      description={field.admin?.description}
      label={field.label}
      onChange={handleChange}
      path={path}
      placeholder={fieldPlaceholder(field)}
      readOnly={readOnly || disabled}
      required={field.required}
      showError={showError}
      style={{ width: adminWidth(field) }}
      value={displayValue}
    />
  );
};
