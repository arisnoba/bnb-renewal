'use client';

import type { RelationshipFieldClientComponent } from 'payload';

import { RelationshipField, useField } from '@payloadcms/ui';

import type { CurriculumCenter } from '@/lib/curriculumOptions';

function normalizeCenter(value: unknown): CurriculumCenter | undefined {
  return value === 'art' || value === 'exam' || value === 'highteen' || value === 'avenue'
    ? value
    : undefined;
}

export const CurriculumTeacherField: RelationshipFieldClientComponent = props => {
  const { value: centerValue } = useField<string>({
    potentiallyStalePath: 'centers',
  });
  const center = normalizeCenter(centerValue);
  const showCenterMessage = !center;

  return (
    <>
      <RelationshipField {...props} readOnly={showCenterMessage} />
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
