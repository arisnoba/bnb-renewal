'use client';

import type { SelectFieldClientComponent } from 'payload';
import type { CSSProperties } from 'react';

import { SelectField, useAuth, useField } from '@payloadcms/ui';

const validCenters = new Set(['art', 'exam', 'kids', 'highteen', 'avenue']);
const staticPublicPageCenters = new Set(['exam', 'kids']);

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
  const permissionLevel = (user as { permissionLevel?: unknown }).permissionLevel;

  return (
    role === 'master' ||
    role === 'admin' ||
    (typeof permissionLevel === 'number' && permissionLevel >= 80)
  );
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
  const usesStaticPublicPage = typeof value === 'string' && staticPublicPageCenters.has(value);

  return (
    <div
      style={
        {
          '--field-width': '50%',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        } as CSSProperties
      }>
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
            margin: '4px 0 0',
          }}>
          센터를 먼저 선택해 주세요.
        </p>
      ) : null}
      {usesStaticPublicPage ? (
        <p
          style={{
            color: 'var(--theme-elevation-600)',
            fontSize: 12,
            margin: '4px 0 0',
          }}>
          입시센터와 키즈센터 커리큘럼 공개 페이지는 현재 정적 콘텐츠로 운영됩니다. 이 항목은
          관리자 분류와 보관용으로 사용되며 공개 페이지에 자동 노출되지 않습니다.
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
