'use client';

import type { SelectFieldClientComponent } from 'payload';

import { SelectField, useAuth, useField } from '@payloadcms/ui';
import { useEffect } from 'react';

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
  const { setValue, value } = useField<string>({
    potentiallyStalePath: props.path,
  });

  useEffect(() => {
    if (!canEditCenter && userCenter && value !== userCenter) {
      setValue(userCenter);
    }
  }, [canEditCenter, setValue, userCenter, value]);

  return (
    <>
      <SelectField {...props} readOnly={!canEditCenter} />
      {!canEditCenter ? (
        <p
          style={{
            color: 'var(--theme-elevation-600)',
            fontSize: 12,
            margin: 0,
          }}>
          소속 센터가 자동 선택됩니다. 센터 변경은 센터 통합 매니저 이상만 가능합니다.
        </p>
      ) : null}
    </>
  );
};
