'use client';

import type { SelectFieldClientComponent } from 'payload';

import { SelectField, useAuth, useField } from '@payloadcms/ui';

const validCenters = new Set(['art', 'exam', 'highteen', 'avenue']);

function getUserCenter(user: unknown) {
  if (!user || typeof user !== 'object') {
    return undefined;
  }

  const center = (user as { center?: unknown }).center;

  return typeof center === 'string' && validCenters.has(center) ? center : undefined;
}

function isGlobalAdmin(user: unknown) {
  if (!user || typeof user !== 'object') {
    return false;
  }

  const role = (user as { role?: unknown }).role;

  return role === 'master' || role === 'admin';
}

export const CurriculumCenterField: SelectFieldClientComponent = props => {
  const { user } = useAuth();
  const userCenter = getUserCenter(user);
  const canEditCenter = isGlobalAdmin(user);
  const { value } = useField<string>({
    potentiallyStalePath: props.path,
  });
  const options = canEditCenter
    ? props.field.options
    : props.field.options.filter((option) => typeof option === 'object' && option.value === userCenter);
  const hasCenter = typeof value === 'string' && validCenters.has(value);

  return (
    <div
      style={{
        display: 'grid',
        width: '100%',
      }}>
      <SelectField
        {...props}
        field={{
          ...props.field,
          options,
        }}
      />
      {!hasCenter ? (
        <p
          style={{
            color: 'var(--theme-error-500)',
            fontSize: 12,
            margin: '-12px 0 0',
          }}>
          센터를 먼저 선택해 주세요.
        </p>
      ) : null}
      {!canEditCenter ? (
        <p
          style={{
            color: 'var(--theme-elevation-600)',
            fontSize: 12,
            margin: 0,
          }}>
          소속 센터만 선택할 수 있습니다.
        </p>
      ) : null}
    </div>
  );
};
