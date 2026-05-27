'use client';

import type { SelectFieldClientComponent } from 'payload';

import { SelectField, useField } from '@payloadcms/ui';
import { useEffect, useMemo } from 'react';

import {
  curriculumClassOptions,
  curriculumClassOptionsByCenter,
  type CurriculumCenter,
} from '@/lib/curriculumOptions';

function normalizeCenter(value: unknown): CurriculumCenter | undefined {
  return value === 'art' || value === 'exam' || value === 'highteen' || value === 'avenue'
    ? value
    : undefined;
}

export const CurriculumClassField: SelectFieldClientComponent = props => {
  const { setValue, value } = useField<string>({
    potentiallyStalePath: props.path,
  });
  const { value: centerValue } = useField<string>({
    potentiallyStalePath: 'centers',
  });
  const center = normalizeCenter(centerValue);
  const options = useMemo(
    () => (center ? curriculumClassOptionsByCenter[center] : curriculumClassOptions),
    [center],
  );
  const fieldValue = typeof value === 'string' ? value : '';

  useEffect(() => {
    if (fieldValue && !options.some((option) => option.value === fieldValue)) {
      setValue('');
    }
  }, [fieldValue, options, setValue]);

  return (
    <SelectField
      {...props}
      field={{
        ...props.field,
        options,
      }}
    />
  );
};
