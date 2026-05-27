'use client';

import type { SelectFieldClientComponent } from 'payload';

import { SelectField, useField } from '@payloadcms/ui';
import { useEffect, useMemo } from 'react';

import {
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
    () => (center ? curriculumClassOptionsByCenter[center] : []),
    [center],
  );
  const fieldValue = typeof value === 'string' ? value : '';
  const showCenterMessage = !center;

  useEffect(() => {
    if (fieldValue && !options.some((option) => option.value === fieldValue)) {
      setValue('');
    }
  }, [fieldValue, options, setValue]);

  return (
    <>
    <SelectField
      {...props}
      field={{
        ...props.field,
        options,
      }}
      readOnly={showCenterMessage}
    />
    {showCenterMessage ? (
      <p
        style={{
          color: 'var(--theme-error-500)',
          fontSize: 12,
          marginTop: -12,
        }}>
        센터를 먼저 선택해야 합니다.
      </p>
    ) : null}
    </>
  );
};
