'use client';

import type { RelationshipFieldClientComponent } from 'payload';

import { RelationshipField, useFormFields } from '@payloadcms/ui';

import type { CurriculumCenter } from '@/lib/curriculumOptions';

function normalizeCenter(value: unknown): CurriculumCenter | undefined {
  return value === 'art' || value === 'exam' || value === 'highteen' || value === 'avenue'
    ? value
    : undefined;
}

export const CurriculumTeacherField: RelationshipFieldClientComponent = props => {
  const centerValue = useFormFields(([fields]) => fields.centers?.value);
  const center = normalizeCenter(centerValue);
  const isDisabledUntilCenterSelected = !center;

  return <RelationshipField {...props} readOnly={isDisabledUntilCenterSelected} />;
};
