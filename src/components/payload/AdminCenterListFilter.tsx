'use client'

import type { BeforeListTableClientProps } from 'payload'

import { Button, useAuth, useConfig, useListQuery } from '@payloadcms/ui'

import {
  buildCenterListWhere,
  centerListFilterConfig,
  selectedCenterFromWhere,
  type CenterListFilterValue,
} from './AdminCenterListFilter.utils'

const centerOptions: Array<{ label: string; value: CenterListFilterValue }> = [
  { label: '전체', value: 'all' },
  { label: '아트', value: 'art' },
  { label: '입시', value: 'exam' },
  { label: '키즈', value: 'kids' },
  { label: '하이틴', value: 'highteen' },
  { label: '애비뉴', value: 'avenue' },
]

function isGlobalAdmin(user: unknown) {
  if (!user || typeof user !== 'object') {
    return false
  }

  const role = (user as { role?: unknown }).role
  const permissionLevel = (user as { permissionLevel?: unknown }).permissionLevel

  return (
    role === 'master' ||
    role === 'admin' ||
    (typeof permissionLevel === 'number' && permissionLevel >= 80)
  )
}

export const AdminCenterListFilter = ({ collectionSlug }: BeforeListTableClientProps) => {
  const { user } = useAuth()
  const { getEntityConfig } = useConfig()
  const { query, refineListData } = useListQuery()

  if (!isGlobalAdmin(user)) {
    return null
  }

  const collectionConfig = getEntityConfig({ collectionSlug })
  const centerFilterConfig = centerListFilterConfig(collectionConfig.fields)

  if (!centerFilterConfig) {
    return null
  }

  const activeCenter =
    selectedCenterFromWhere(query?.where, centerFilterConfig.fieldName) ??
    selectedCenterFromWhere(query, centerFilterConfig.fieldName) ??
    'all'

  return (
    <div
      style={{
        alignItems: 'center',
        borderBottom: '1px solid var(--theme-border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 'calc(var(--base) / 2)',
        paddingBottom: 'calc(var(--base) / 2)',
      }}
    >
      <span
        style={{
          color: 'var(--theme-elevation-700)',
          fontSize: 12,
          fontWeight: 600,
          marginRight: 4,
        }}
      >
        센터 빠른 필터
      </span>
      {centerOptions.map((option) => {
        const isActive = activeCenter === option.value

        return (
          <Button
            aria-label={`${option.label} 센터 필터`}
            buttonStyle={isActive ? 'primary' : 'secondary'}
            key={option.value}
            onClick={() => {
              void refineListData({
                where: buildCenterListWhere({
                  center: option.value,
                  existingWhere: query?.where,
                  ...centerFilterConfig,
                }),
              })
            }}
            size="small"
            type="button"
          >
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}
