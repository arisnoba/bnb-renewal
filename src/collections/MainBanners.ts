import type {
  Access,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Validate,
  Where,
} from 'payload'
import { revalidatePath } from 'next/cache'

import type { MainBanner } from '@/payload-types'

import {
  ADMIN_IMAGE_UPLOAD_LIMIT_LABEL,
  MAIN_BANNER_DESKTOP_VIDEO_RECOMMENDED_LIMIT_LABEL,
  MAIN_BANNER_MOBILE_VIDEO_RECOMMENDED_LIMIT_LABEL,
} from '@/lib/mediaUploadPolicy'
import {
  centerOptions,
  type CenterValue,
  isGlobalAdminUser,
  publishingStatusSelectAdmin,
  userCenterValue,
} from './shared'
import { normalizeUploadedMediaPrefixes } from './mediaPrefixNormalization'

type MainBannerData = {
  center?: unknown
  linkedExamReviewItems?: unknown
  linkedProfileItems?: unknown
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
const duplicatedTitleSuffix = ' - 복제됨'
const mainBannerImageUploadDescription = `이미지는 ${ADMIN_IMAGE_UPLOAD_LIMIT_LABEL} 이하로 압축한 운영본만 업로드할 수 있습니다.`
const mainBannerDesktopVideoUploadDescription = `선택 사항입니다. 데스크톱 배경 영상은 ${MAIN_BANNER_DESKTOP_VIDEO_RECOMMENDED_LIMIT_LABEL} 이하, 10초 내외, 무음 반복용 MP4/WebM을 권장합니다. 포스터 이미지는 데스크톱 이미지를 사용합니다.`
const mainBannerMobileVideoUploadDescription = `선택 사항입니다. 모바일 배경 영상은 ${MAIN_BANNER_MOBILE_VIDEO_RECOMMENDED_LIMIT_LABEL} 이하, 10초 내외, 무음 반복용 MP4/WebM을 권장합니다. 비워두면 데스크톱 영상을 모바일에도 사용합니다.`

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

export function duplicatedMainBannerTitle(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const title = value.trim()

  if (!title || title.endsWith(duplicatedTitleSuffix)) {
    return title
  }

  return `${title}${duplicatedTitleSuffix}`
}

export function duplicatedMainBannerStatus() {
  return 'draft'
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

const uniqueNestedRelationshipRowsWithinEachParent =
  (arrayFieldName: string, relationshipFieldName: string, message: string): Validate<unknown[]> =>
  (value) => {
    if (!Array.isArray(value)) {
      return true
    }

    for (const row of value) {
      if (!row || typeof row !== 'object') {
        continue
      }

      const nestedRows = (row as Record<string, unknown>)[arrayFieldName]

      if (!Array.isArray(nestedRows)) {
        continue
      }

      const seen = new Set<string>()

      for (const nestedRow of nestedRows) {
        if (!nestedRow || typeof nestedRow !== 'object') {
          continue
        }

        const id = relationshipId(
          (nestedRow as Record<string, unknown>)[relationshipFieldName],
        )

        if (!id) {
          continue
        }

        if (seen.has(id)) {
          return message
        }

        seen.add(id)
      }
    }

    return true
  }

const requiredManualResultLabel: Validate<unknown> = (value, { siblingData }) => {
  const school = relationshipId(
    siblingData && typeof siblingData === 'object'
      ? (siblingData as Record<string, unknown>).school
      : undefined,
  )

  if (school) {
    return true
  }

  return typeof value === 'string' && value.trim()
    ? true
    : '대학교를 선택하거나 직접 노출 문구를 입력해야 합니다.'
}

const requiredWhenReserved =
  (message: string): Validate<unknown, unknown, MainBannerData> =>
  (value, { siblingData }) => {
    return siblingData?.useReservation && !value ? message : true
  }

function dedupeExamReviewRowsWithinEachGroup(value: unknown) {
  if (!Array.isArray(value)) {
    return value
  }

  return value.map((group) => {
    if (!group || typeof group !== 'object') {
      return group
    }

    const groupRecord = group as Record<string, unknown>
    const reviews = groupRecord.reviews

    if (!Array.isArray(reviews)) {
      return group
    }

    const seen = new Set<string>()
    const dedupedReviews = reviews.filter((row) => {
      if (!row || typeof row !== 'object') {
        return false
      }

      const id = relationshipId((row as Record<string, unknown>).review)

      if (!id || seen.has(id)) {
        return false
      }

      seen.add(id)

      return true
    })

    return {
      ...groupRecord,
      reviews: dedupedReviews,
    }
  })
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
    nextData.linkedExamReviewItems = dedupeExamReviewRowsWithinEachGroup(
      nextData.linkedExamReviewItems,
    )
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
    | Parameters<CollectionAfterDeleteHook<MainBanner>>[0]['req']
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

const revalidateMainBannerAfterDelete: CollectionAfterDeleteHook<MainBanner> = ({
  doc,
  req,
}) => {
  const center = selectedCenter(doc) as CenterValue | undefined

  if (center) {
    revalidateMainBannerCenterPaths({ center, req })
  }

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
    afterDelete: [revalidateMainBannerAfterDelete],
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
              hooks: {
                beforeDuplicate: [({ value }) => duplicatedMainBannerTitle(value)],
              },
              validate: requiredText('제목을 입력해야 합니다.'),
            },
            {
              name: 'center',
              type: 'select',
              label: '센터',
              admin: {
                components: {
                  Field:
                    '@/components/payload/MainBannerCenterField#MainBannerCenterField',
                },
              },
              options: centerOptions,
              validate: requiredValue('센터를 선택해야 합니다.'),
            },
            {
              name: 'broadcaster',
              type: 'text',
              label: '타이틀',
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
              admin: {
                description: mainBannerImageUploadDescription,
              },
              validate: requiredValue('데스크톱 이미지를 선택해야 합니다.'),
            },
            {
              name: 'mobileImage',
              type: 'upload',
              label: '모바일 이미지',
              relationTo: 'media',
              admin: {
                description: `${mainBannerImageUploadDescription} 비워두면 데스크톱 이미지를 모바일에도 사용합니다.`,
              },
            },
            {
              name: 'desktopVideo',
              type: 'upload',
              label: '데스크톱 영상',
              relationTo: 'media',
              admin: {
                description: mainBannerDesktopVideoUploadDescription,
              },
            },
            {
              name: 'mobileVideo',
              type: 'upload',
              label: '모바일 영상',
              relationTo: 'media',
              admin: {
                description: mainBannerMobileVideoUploadDescription,
              },
            },
          ],
        },
        {
          label: '연결 콘텐츠',
          fields: [
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
                description:
                  '입시센터 배너는 대학교 그룹별로 여러 학생 후기를 연결합니다.',
              },
              validate: uniqueNestedRelationshipRowsWithinEachParent(
                'reviews',
                'review',
                '같은 대학교 그룹 안에서는 같은 합격후기를 한 번만 연결할 수 있습니다.',
              ),
              fields: [
                {
                  name: 'school',
                  type: 'relationship',
                  label: '대학교',
                  relationTo: 'exam-school-logos',
                  admin: {
                    description:
                      '선택하면 대학명과 로고를 메인 슬라이드 데코에 사용합니다.',
                  },
                },
                {
                  name: 'resultLabel',
                  type: 'text',
                  label: '직접 노출 문구',
                  admin: {
                    description:
                      '예: 세종대 최종합격. 대학 로고 설정을 선택하지 않았을 때 사용합니다.',
                  },
                  validate: requiredManualResultLabel,
                },
                {
                  name: 'reviewPicker',
                  type: 'relationship',
                  label: '학생 후기',
                  relationTo: 'exam-passed-reviews',
                  hasMany: true,
                  virtual: true,
                  admin: {
                    components: {
                      Field:
                        '@/components/payload/MainBannerExamReviewsPickerField#MainBannerExamReviewsPickerField',
                    },
                    description:
                      '여러 학생 후기를 한 번에 선택하면 저장용 학생 후기 목록에 자동 반영됩니다.',
                  },
                  validate: (value) =>
                    Array.isArray(value) && value.length > 0
                      ? true
                      : '학생 후기를 하나 이상 선택해야 합니다.',
                },
                {
                  name: 'reviews',
                  type: 'array',
                  label: '학생 후기',
                  labels: {
                    plural: '학생 후기',
                    singular: '학생 후기',
                  },
                  admin: {
                    hidden: true,
                    description: '이 대학교 그룹에 노출할 합격 학생 후기를 추가하세요.',
                  },
                  fields: [
                    {
                      name: 'review',
                      type: 'relationship',
                      label: '합격후기',
                      relationTo: 'exam-passed-reviews',
                      validate: requiredValue('합격후기를 선택해야 합니다.'),
                    },
                  ],
                  validate: (value) =>
                    Array.isArray(value) && value.length > 0
                      ? true
                      : '학생 후기를 하나 이상 선택해야 합니다.',
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
      hooks: {
        beforeDuplicate: [duplicatedMainBannerStatus],
      },
      options: statusOptions,
      validate: requiredValue('상태를 선택해야 합니다.'),
      admin: publishingStatusSelectAdmin({
        position: 'sidebar',
      }),
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
