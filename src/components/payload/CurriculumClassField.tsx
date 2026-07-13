'use client';

import type { SelectFieldClientComponent } from 'payload';

import { SelectField, useField, useFormFields } from '@payloadcms/ui';
import { useEffect, useMemo } from 'react';

import {
  curriculumClassOptionsByCenter,
  type CurriculumCenter,
} from '@/lib/curriculumOptions';

function normalizeCenter(value: unknown): CurriculumCenter | undefined {
  return value === 'art' || value === 'exam' || value === 'kids' || value === 'highteen' || value === 'avenue'
    ? value
    : undefined;
}

export const CurriculumClassField: SelectFieldClientComponent = props => {
  const { setValue, value } = useField<string>({
    potentiallyStalePath: props.path,
  });
  const centerValue = useFormFields(([fields]) => fields.centers?.value);
  const center = normalizeCenter(centerValue);
  const options = useMemo(
    () => (center ? curriculumClassOptionsByCenter[center] : []),
    [center],
  );
  const fieldValue = typeof value === 'string' ? value : '';
  const isDisabledUntilCenterSelected = !center;

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
      readOnly={isDisabledUntilCenterSelected}
    />
  );
};
