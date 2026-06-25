import type {
  Access,
  CollectionAfterChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Validate,
  Where,
} from 'payload'
import { revalidatePath } from 'next/cache'

import type { MainBanner } from '@/payload-types'

import { centerOptions, type CenterValue, isGlobalAdminUser, userCenterValue } from './shared'
import { normalizeUploadedMediaPrefixes } from './mediaPrefixNormalization'

type MainBannerData = {
  center?: unknown
  publishStartAt?: unknown
  useReservation?: unknown
}

type MainBannerOrderField = `${CenterValue}Banners`
type RevalidatePath = (originalPath: string, type?: 'layout' | 'page') => void
type MainBannerOrderRow = {
  banner?: ({ id?: unknown } & Record<string, unknown>) | number | string | null
  id?: string | null
}
type MainBannerOrderData = Partial<Record<MainBannerOrderField, MainBannerOrderRow[] | null>>

const statusOptions = [
  { label: '임시저장', value: 'draft' },
  { label: '공개', value: 'published' },
]

const centerValues = new Set(centerOptions.map((option) => option.value))
const mainBannerOrderFieldByCenter = Object.fromEntries(
  centerOptions.map((option) => [option.value, `${option.value}Banners`]),
) as Record<CenterValue, MainBannerOrderField>

const allowRead: Access = () => true

const createAccess: Access = ({ req }) => {
  return Boolean(req.user && (isGlobalAdminUser(req.user) || userCenterValue(req.user)))
}

const centerAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  if (isGlobalAdminUser(req.user)) {
    return true
  }

  const center = userCenterValue(req.user)

  return center
    ? {
        center: {
          equals: center,
        },
      }
    : false
}

const requiredText =
  (message: string): Validate<unknown> =>
  (value) => {
    return typeof value === 'string' && value.trim() ? true : message
  }

const requiredValue =
  (message: string): Validate<unknown> =>
  (value) => {
    return value ? true : message
  }

function relationshipId(value: unknown) {
  if (!value) {
    return ''
  }

  if (typeof value === 'object') {
    return String((value as { id?: unknown }).id ?? '').trim()
  }

  return String(value).trim()
}

const uniqueRelationshipRows =
  (fieldName: string, message: string): Validate<unknown[]> =>
  (value) => {
    if (!Array.isArray(value)) {
      return true
    }

    const seen = new Set<string>()

    for (const row of value) {
      if (!row || typeof row !== 'object') {
        continue
      }

      const id = relationshipId((row as Record<string, unknown>)[fieldName])

      if (!id) {
        continue
      }

      if (seen.has(id)) {
        return message
      }

      seen.add(id)
    }

    return true
  }

const requiredWhenReserved =
  (message: string): Validate<unknown, unknown, MainBannerData> =>
  (value, { siblingData }) => {
    return siblingData?.useReservation && !value ? message : true
  }

function dateValue(value: unknown) {
  if (!value) {
    return undefined
  }

  const date = new Date(value as string | Date)

  return Number.isNaN(date.getTime()) ? undefined : date
}

const validatePublishEndAt: Validate<unknown, unknown, MainBannerData> = (
  value,
  options,
) => {
  if (!options.siblingData?.useReservation) {
    return true
  }

  const requiredResult = requiredWhenReserved('예약 종료일을 선택해야 합니다.')(value, options)

  if (requiredResult !== true) {
    return requiredResult
  }

  if (!value) {
    return true
  }

  const startAt = dateValue(options.siblingData?.publishStartAt)
  const endAt = dateValue(value)

  if (startAt && endAt && endAt < startAt) {
    return '종료일은 시작일보다 빠를 수 없습니다.'
  }

  return true
}

function selectedCenter(data?: unknown, siblingData?: unknown) {
  const siblingCenter =
    siblingData && typeof siblingData === 'object'
      ? (siblingData as MainBannerData).center
      : undefined
  const documentCenter =
    data && typeof data === 'object' ? (data as MainBannerData).center : undefined
  const value = siblingCenter ?? documentCenter
  const center = String(value ?? '').trim()

  return centerValues.has(center) ? center : undefined
}

function profileFilterForSelectedCenter({
  data,
  siblingData,
}: {
  data?: unknown
  siblingData?: unknown
}): Where {
  const center = selectedCenter(data, siblingData)

  if (!center || center === 'exam') {
    return {
      id: {
        equals: -1,
      },
    }
  }

  return {
    centers: {
      contains: center,
    },
  }
}

const normalizeMainBannerData: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!data) {
    return data
  }

  const nextData = { ...data }
  const userCenter = userCenterValue(req.user)

  if (req.user && !isGlobalAdminUser(req.user)) {
    nextData.center = originalDoc?.center ?? userCenter
  }

  if (nextData.center === 'exam') {
    nextData.linkedProfileItems = []
  } else {
    nextData.linkedExamReviewItems = []
  }

  if (!nextData.useReservation) {
    nextData.publishStartAt = null
    nextData.publishEndAt = null
  }

  return nextData
}

function bannerId(value: MainBannerOrderRow['banner']) {
  if (!value) {
    return ''
  }

  if (typeof value === 'object') {
    return String(value.id ?? '').trim()
  }

  return String(value).trim()
}

export function mainBannerOrderField(center: CenterValue): MainBannerOrderField {
  return mainBannerOrderFieldByCenter[center]
}

export function mainBannerOrderIncludes(
  rows: MainBannerOrderRow[] | null | undefined,
  targetBannerId: MainBanner['id'],
) {
  const targetId = String(targetBannerId).trim()

  return (rows ?? []).some((row) => bannerId(row.banner) === targetId)
}

export function mainBannerOrderWithout(
  rows: MainBannerOrderRow[] | null | undefined,
  targetBannerId: MainBanner['id'],
) {
  const targetId = String(targetBannerId).trim()

  return (rows ?? []).filter((row) => bannerId(row.banner) !== targetId)
}

export function mainBannerCenterPaths(
  center: CenterValue,
  previousCenter?: CenterValue,
) {
  return Array.from(
    new Set(
      [center, previousCenter]
        .filter((value): value is CenterValue => Boolean(value))
        .map((value) => `/${value}`),
    ),
  )
}

function revalidateMainBannerCenterPaths({
  center,
  previousCenter,
  revalidate = revalidatePath,
  req,
}: {
  center: CenterValue
  previousCenter?: CenterValue
  revalidate?: RevalidatePath
  req: Parameters<CollectionAfterChangeHook<MainBanner>>[0]['req']
}) {
  if (req.context.disableRevalidate) {
    return
  }

  for (const path of mainBannerCenterPaths(center, previousCenter)) {
    req.payload.logger.info(`Revalidating main banner path ${path}`)
    revalidate(path, 'page')
  }
}

const syncMainBannerOrder: CollectionAfterChangeHook<MainBanner> = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const center = selectedCenter(doc) as CenterValue | undefined
  const previousCenter = selectedCenter(previousDoc) as CenterValue | undefined

  if (!center) {
    return doc
  }

  const main = (await req.payload.findGlobal({
    slug: 'main',
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as MainBannerOrderData
  const centerOrderField = mainBannerOrderField(center)
  const currentRows = main[centerOrderField]
  const shouldMoveFromPreviousCenter = Boolean(previousCenter && previousCenter !== center)
  const alreadyOrdered = mainBannerOrderIncludes(currentRows, doc.id)

  if (!shouldMoveFromPreviousCenter && alreadyOrdered && operation !== 'create') {
    revalidateMainBannerCenterPaths({ center, previousCenter, req })

    return doc
  }

  const data: MainBannerOrderData = {
    [centerOrderField]: [
      { banner: doc.id },
      ...mainBannerOrderWithout(currentRows, doc.id),
    ],
  }

  if (shouldMoveFromPreviousCenter && previousCenter) {
    const previousOrderField = mainBannerOrderField(previousCenter)

    data[previousOrderField] = mainBannerOrderWithout(main[previousOrderField], doc.id)
  }

  await req.payload.updateGlobal({
    slug: 'main',
    data,
    depth: 0,
    overrideAccess: true,
    req,
  })

  revalidateMainBannerCenterPaths({ center, previousCenter, req })

  return doc
}

export const MainBanners: CollectionConfig = {
  slug: 'main-banners',
  labels: {
    plural: '메인 배너',
    singular: '메인 배너',
  },
  access: {
    create: createAccess,
    delete: centerAccess,
    read: allowRead,
    update: centerAccess,
  },
  admin: {
    defaultColumns: ['title', 'center', 'status', 'useReservation', 'updatedAt'],
    group: '메인설정',
    useAsTitle: 'title',
  },
  defaultSort: '-updatedAt',
  hooks: {
    afterChange: [
      syncMainBannerOrder,
      normalizeUploadedMediaPrefixes([
        { path: 'desktopImage', role: 'main-banners.desktop-image' },
        { path: 'mobileImage', role: 'main-banners.mobile-image' },
        { path: 'desktopVideo', role: 'main-banners.desktop-video' },
        { path: 'mobileVideo', role: 'main-banners.mobile-video' },
      ]),
    ],
    beforeValidate: [normalizeMainBannerData],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: '내용',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: '제목',
              validate: requiredText('제목을 입력해야 합니다.'),
            },
            {
              name: 'broadcaster',
              type: 'text',
              label: '방송사/출처',
            },
            {
              name: 'description',
              type: 'textarea',
              label: '설명',
            },
          ],
        },
        {
          label: '미디어',
          fields: [
            {
              name: 'desktopImage',
              type: 'upload',
              label: '데스크톱 이미지',
              relationTo: 'media',
              validate: requiredValue('데스크톱 이미지를 선택해야 합니다.'),
            },
            {
              name: 'mobileImage',
              type: 'upload',
              label: '모바일 이미지',
              relationTo: 'media',
              admin: {
                description: '비워두면 데스크톱 이미지를 모바일에도 사용합니다.',
              },
            },
            {
              name: 'desktopVideo',
              type: 'upload',
              label: '데스크톱 영상',
              relationTo: 'media',
            },
            {
              name: 'mobileVideo',
              type: 'upload',
              label: '모바일 영상',
              relationTo: 'media',
              admin: {
                description: '비워두면 데스크톱 영상을 모바일에도 사용합니다.',
              },
            },
          ],
        },
        {
          label: '연결 콘텐츠',
          fields: [
            {
              name: 'center',
              type: 'select',
              label: '센터',
              options: centerOptions,
              validate: requiredValue('센터를 선택해야 합니다.'),
            },
            {
              name: 'linkedProfileItems',
              type: 'array',
              label: '연결 프로필',
              labels: {
                plural: '연결 프로필',
                singular: '연결 프로필',
              },
              admin: {
                condition: (_data, siblingData) =>
                  siblingData?.center && siblingData.center !== 'exam',
                components: {
                  RowLabel:
                    '@/components/payload/MainBannerProfileItemRowLabel#MainBannerProfileItemRowLabel',
                },
                description: '입시센터 외 센터는 배우 프로필을 연결합니다.',
              },
              validate: uniqueRelationshipRows(
                'profile',
                '같은 프로필은 한 번만 연결할 수 있습니다.',
              ),
              fields: [
                {
                  name: 'profile',
                  type: 'relationship',
                  label: '프로필',
                  relationTo: 'profiles',
                  filterOptions: profileFilterForSelectedCenter,
                  validate: requiredValue('프로필을 선택해야 합니다.'),
                },
                {
                  name: 'roleLabel',
                  type: 'text',
                  label: '역할/노출 문구',
                  admin: {
                    description: '예: 아이돌 연습생, 여주. 프론트에서는 뒤에 "역"이 자동으로 붙습니다.',
                  },
                  validate: requiredText('역할/노출 문구를 입력해야 합니다.'),
                },
              ],
            },
            {
              name: 'linkedExamReviewItems',
              type: 'array',
              label: '연결 합격후기',
              labels: {
                plural: '연결 합격후기',
                singular: '연결 합격후기',
              },
              admin: {
                condition: (_data, siblingData) => siblingData?.center === 'exam',
                components: {
                  RowLabel:
                    '@/components/payload/MainBannerExamReviewItemRowLabel#MainBannerExamReviewItemRowLabel',
                },
                description: '입시센터 배너는 합격후기를 연결합니다.',
              },
              validate: uniqueRelationshipRows(
                'review',
                '같은 합격후기는 한 번만 연결할 수 있습니다.',
              ),
              fields: [
                {
                  name: 'review',
                  type: 'relationship',
                  label: '합격후기',
                  relationTo: 'exam-passed-reviews',
                  validate: requiredValue('합격후기를 선택해야 합니다.'),
                },
                {
                  name: 'resultLabel',
                  type: 'text',
                  label: '합격 대학/노출 문구',
                  admin: {
                    description: '예: 한예종, 세종대, 건국대',
                  },
                  validate: requiredText('합격 대학/노출 문구를 입력해야 합니다.'),
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: '상태',
      defaultValue: 'draft',
      options: statusOptions,
      validate: requiredValue('상태를 선택해야 합니다.'),
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'useReservation',
      type: 'checkbox',
      label: '예약하기',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishStartAt',
      type: 'date',
      label: '예약 시작일',
      defaultValue: () => new Date().toISOString(),
      admin: {
        condition: (_data, siblingData) => Boolean(siblingData?.useReservation),
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm',
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      validate: requiredWhenReserved('예약 시작일을 선택해야 합니다.'),
    },
    {
      name: 'publishEndAt',
      type: 'date',
      label: '예약 종료일',
      admin: {
        condition: (_data, siblingData) => Boolean(siblingData?.useReservation),
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm',
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      validate: validatePublishEndAt,
    },
  ],
}
