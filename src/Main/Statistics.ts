import type {
  Access,
  Field,
  FieldAccess,
  GlobalAfterChangeHook,
  GlobalBeforeChangeHook,
  GlobalConfig,
  Validate,
} from 'payload'
import { revalidatePath } from 'next/cache'

import { centerOptions, type CenterValue, isGlobalAdminUser, userCenterValue } from '@/collections/shared'

type MainStatisticsData = Record<string, unknown>

type CenterStatisticKeys = {
  monthlyLeadSupporting: `${CenterValue}MonthlyLeadSupporting`
  monthlyMinorExtra: `${CenterValue}MonthlyMinorExtra`
  totalWorkCount: `${CenterValue}TotalWorkCount`
}

const centerLabelByValue = Object.fromEntries(
  centerOptions.map((option) => [option.value, option.label]),
) as Record<CenterValue, string>

const nonNegativeInteger =
  (message: string): Validate<unknown> =>
  (value) => {
    if (value === undefined || value === null || value === '') {
      return message
    }

    return typeof value === 'number' && Number.isInteger(value) && value >= 0
      ? true
      : message
  }

const updateGlobalAccess: Access = ({ req }) => {
  return Boolean(req.user && (isGlobalAdminUser(req.user) || userCenterValue(req.user)))
}

const canUpdateCenter =
  (center: CenterValue): FieldAccess =>
  ({ req }) => {
    return isGlobalAdminUser(req.user) || userCenterValue(req.user) === center
  }

function centerStatisticKeys(center: CenterValue): CenterStatisticKeys {
  return {
    monthlyLeadSupporting: `${center}MonthlyLeadSupporting`,
    monthlyMinorExtra: `${center}MonthlyMinorExtra`,
    totalWorkCount: `${center}TotalWorkCount`,
  }
}

function statisticNumberField(name: string, label: string, center: CenterValue): Field {
  return {
    name,
    type: 'number',
    label,
    access: {
      update: canUpdateCenter(center),
    },
    defaultValue: 0,
    min: 0,
    validate: nonNegativeInteger('0 이상의 정수로 입력해야 합니다.'),
  }
}

function centerStatisticFields(center: CenterValue): Field[] {
  const keys = centerStatisticKeys(center)

  return [
    statisticNumberField(keys.totalWorkCount, '누적 작품 수', center),
    {
      type: 'group',
      label: '이달의 주·조연',
      name: keys.monthlyLeadSupporting,
      access: {
        update: canUpdateCenter(center),
      },
      fields: [
        statisticNumberField('auditionCount', '오디션 진행', center),
        statisticNumberField('directorMeetingCount', '최종 감독 미팅', center),
      ],
    },
    {
      type: 'group',
      label: '이달의 조·단역',
      name: keys.monthlyMinorExtra,
      access: {
        update: canUpdateCenter(center),
      },
      fields: [
        statisticNumberField('listupCount', '리스트업 인원', center),
        statisticNumberField('castingConfirmedCount', '캐스팅 확정', center),
      ],
    },
  ]
}

function preserveOtherCenterData(
  data: MainStatisticsData,
  originalDoc: MainStatisticsData | undefined,
  allowedCenter: CenterValue,
) {
  const nextData = { ...data }

  for (const option of centerOptions) {
    const center = option.value

    if (center === allowedCenter) {
      continue
    }

    const keys = centerStatisticKeys(center)

    nextData[keys.totalWorkCount] = originalDoc?.[keys.totalWorkCount]
    nextData[keys.monthlyLeadSupporting] = originalDoc?.[keys.monthlyLeadSupporting]
    nextData[keys.monthlyMinorExtra] = originalDoc?.[keys.monthlyMinorExtra]
  }

  return nextData
}

export const restrictCenterStatisticUpdates: GlobalBeforeChangeHook = ({
  data,
  originalDoc,
  req,
}) => {
  if (!req.user || isGlobalAdminUser(req.user)) {
    return data
  }

  const center = userCenterValue(req.user)

  if (!center) {
    return originalDoc ?? data
  }

  return preserveOtherCenterData(data, originalDoc, center)
}

export const revalidateMainStatisticsCenterPaths: GlobalAfterChangeHook = ({ doc, req }) => {
  if (req.context.disableRevalidate) {
    return doc
  }

  for (const option of centerOptions) {
    const path = `/${option.value}`

    req.payload.logger.info(`Revalidating main statistics path ${path}`)
    revalidatePath(path, 'page')
  }

  return doc
}

export const MainStatistics: GlobalConfig = {
  slug: 'main-statistics',
  label: '통계 설정',
  access: {
    read: () => true,
    update: updateGlobalAccess,
  },
  admin: {
    group: '메인설정',
  },
  hooks: {
    afterChange: [revalidateMainStatisticsCenterPaths],
    beforeChange: [restrictCenterStatisticUpdates],
  },
  fields: [
    {
      type: 'tabs',
      tabs: centerOptions.map((option) => ({
        label: centerLabelByValue[option.value],
        fields: centerStatisticFields(option.value),
      })),
    },
  ],
}
