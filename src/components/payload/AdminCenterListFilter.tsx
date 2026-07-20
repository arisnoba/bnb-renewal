'use client'

import type { BeforeListTableClientProps } from 'payload'

import { Button, useAuth, useConfig, useListQuery } from '@payloadcms/ui'

import {
  buildCompanyListWhere,
  buildExamResultTypeListWhere,
  buildCenterListWhere,
  centerListFilterConfig,
  selectListFilterOptions,
  selectedCompanyFromWhere,
  selectedExamResultTypeFromWhere,
  selectedCenterFromWhere,
  type CenterListFilterValue,
  type CompanyListFilterValue,
  type ExamResultTypeListFilterValue,
} from './AdminCenterListFilter.utils'

type QuickFilterOption<Value extends string> = {
  ariaLabel: string
  label: string
  value: Value
}

const centerOptions: Array<QuickFilterOption<CenterListFilterValue>> = [
  { ariaLabel: '전체 센터 필터', label: '전체', value: 'all' },
  { ariaLabel: '아트 센터 필터', label: '아트', value: 'art' },
  { ariaLabel: '입시 센터 필터', label: '입시', value: 'exam' },
  { ariaLabel: '키즈 센터 필터', label: '키즈', value: 'kids' },
  { ariaLabel: '하이틴 센터 필터', label: '하이틴', value: 'highteen' },
  { ariaLabel: '애비뉴 센터 필터', label: '애비뉴', value: 'avenue' },
]

const examResultTypeOptions: Array<QuickFilterOption<ExamResultTypeListFilterValue>> = [
  { ariaLabel: '전체 학교 필터', label: '전체', value: 'all' },
  { ariaLabel: '대학교 학교 필터', label: '대학교', value: 'university' },
  { ariaLabel: '예술고 학교 필터', label: '예술고', value: 'arts_high_school' },
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

function QuickFilterBar<Value extends string>({
  activeValue,
  label,
  onSelect,
  options,
}: {
  activeValue: Value
  label: string
  onSelect: (value: Value) => void
  options: Array<QuickFilterOption<Value>>
}) {
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
        {label}
      </span>
      {options.map((option) => {
        const isActive = activeValue === option.value

        return (
          <Button
            aria-label={option.ariaLabel}
            buttonStyle={isActive ? 'primary' : 'secondary'}
            key={option.value}
            onClick={() => onSelect(option.value)}
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

export const AdminCenterListFilter = ({ collectionSlug }: BeforeListTableClientProps) => {
  const { user } = useAuth()
  const { getEntityConfig } = useConfig()
  const { query, refineListData } = useListQuery()

  if (collectionSlug === 'exam-results') {
    const activeResultType =
      selectedExamResultTypeFromWhere(query?.where) ??
      selectedExamResultTypeFromWhere(query) ??
      'all'

    return (
      <QuickFilterBar
        activeValue={activeResultType}
        label="학교 필터"
        onSelect={(resultType) => {
          void refineListData({
            where: buildExamResultTypeListWhere({
              existingWhere: query?.where,
              resultType,
            }),
          })
        }}
        options={examResultTypeOptions}
      />
    )
  }

  if (!isGlobalAdmin(user)) {
    return null
  }

  const collectionConfig = getEntityConfig({ collectionSlug })

  if (collectionSlug === 'casting-directors') {
    const activeCompany =
      selectedCompanyFromWhere(query?.where) ?? selectedCompanyFromWhere(query) ?? 'all'
    const companyOptions: Array<QuickFilterOption<CompanyListFilterValue>> = [
      { ariaLabel: '전체 회사 필터', label: '전체', value: 'all' },
      ...selectListFilterOptions(collectionConfig.fields, 'company').map((option) => ({
        ariaLabel: `${option.label} 회사 필터`,
        label: option.label,
        value: option.value,
      })),
    ]

    return (
      <QuickFilterBar
        activeValue={activeCompany}
        label="커스텀 필터"
        onSelect={(company) => {
          void refineListData({
            where: buildCompanyListWhere({
              company,
              existingWhere: query?.where,
            }),
          })
        }}
        options={companyOptions}
      />
    )
  }

  const centerFilterConfig = centerListFilterConfig(collectionConfig.fields)

  if (!centerFilterConfig) {
    return null
  }

  const activeCenter =
    selectedCenterFromWhere(query?.where, centerFilterConfig.fieldName) ??
    selectedCenterFromWhere(query, centerFilterConfig.fieldName) ??
    'all'

  return (
    <QuickFilterBar
      activeValue={activeCenter}
      label="커스텀 필터"
      onSelect={(center) => {
        void refineListData({
          where: buildCenterListWhere({
            center,
            existingWhere: query?.where,
            ...centerFilterConfig,
          }),
        })
      }}
      options={centerOptions}
    />
  )
}
