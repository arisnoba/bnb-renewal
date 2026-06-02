import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, Field, Tab } from 'payload'

import {
  MainBanners,
  mainBannerOrderField,
  mainBannerOrderIncludes,
  mainBannerOrderWithout,
} from './MainBanners'

type NamedField = Field & {
  name: string
  admin?: {
    condition?: (data: Record<string, unknown>, siblingData: Record<string, unknown>) => unknown
    position?: unknown
  }
  defaultValue?: unknown
  fields?: Field[]
  filterOptions?: unknown
  label?: unknown
  relationTo?: unknown
  validate?: (value: unknown, options: { siblingData?: Record<string, unknown> }) => unknown
}

function getTabs(collection: CollectionConfig) {
  const tabsField = collection.fields.find((field) => field.type === 'tabs') as
    | { tabs: Tab[] }
    | undefined

  assert.ok(tabsField, `${collection.slug} 컬렉션에 tabs 필드가 있어야 합니다.`)

  return tabsField.tabs
}

function findField(fields: Field[], fieldName: string): NamedField | undefined {
  for (const field of fields) {
    if ('name' in field && field.name === fieldName) {
      return field as NamedField
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const nestedField = findField(field.fields, fieldName)

      if (nestedField) {
        return nestedField
      }
    }
  }

  return undefined
}

function getField(collection: CollectionConfig, fieldName: string) {
  const field = findField(
    [
      ...collection.fields,
      ...getTabs(collection).flatMap((tab) => tab.fields),
    ],
    fieldName,
  )

  assert.ok(field, `${collection.slug}.${fieldName} 필드가 있어야 합니다.`)

  return field
}

test('main banners are managed as center-scoped posts', () => {
  assert.equal(MainBanners.slug, 'main-banners')
  assert.equal(MainBanners.labels?.plural, '메인 배너')
  assert.equal(MainBanners.labels?.singular, '메인 배너')
  assert.equal(MainBanners.admin?.group, '메인설정')
  assert.equal(MainBanners.admin?.useAsTitle, 'title')
  assert.deepEqual(MainBanners.admin?.defaultColumns, [
    'title',
    'center',
    'status',
    'useReservation',
    'updatedAt',
  ])

  assert.equal(getField(MainBanners, 'linkedProfiles').relationTo, 'profiles')
  assert.equal(getField(MainBanners, 'linkedExamReviews').relationTo, 'exam-passed-reviews')
  assert.equal(
    getField(MainBanners, 'linkedProfiles').admin?.condition?.({}, { center: 'art' }),
    true,
  )
  assert.equal(
    getField(MainBanners, 'linkedProfiles').admin?.condition?.({}, { center: 'exam' }),
    false,
  )
  assert.equal(
    getField(MainBanners, 'linkedExamReviews').admin?.condition?.({}, { center: 'exam' }),
    true,
  )
  assert.equal(MainBanners.hooks?.afterChange?.length, 2)
})

test('main banners can sync into center-specific order arrays without duplicates', () => {
  assert.equal(mainBannerOrderField('art'), 'artBanners')
  assert.equal(mainBannerOrderField('exam'), 'examBanners')

  const rows = [
    { banner: 3 },
    { banner: { id: 7, title: '기존 배너' } },
    { banner: 9 },
  ] as const

  assert.equal(mainBannerOrderIncludes([...rows], 7), true)
  assert.equal(mainBannerOrderIncludes([...rows], 11), false)
  assert.deepEqual(mainBannerOrderWithout([...rows], 7), [{ banner: 3 }, { banner: 9 }])
})

test('main banner save prepends new banner to its center order', async () => {
  const syncOrder = MainBanners.hooks?.afterChange?.[0] as (args: Record<string, unknown>) => unknown
  let updatedData: unknown

  assert.equal(typeof syncOrder, 'function')

  await syncOrder({
    doc: { center: 'exam', id: 7 },
    operation: 'create',
    req: {
      payload: {
        findGlobal: async () => ({
          examBanners: [{ banner: 5 }, { banner: { id: 1, title: '기존 배너' } }],
        }),
        updateGlobal: async ({ data }: { data: unknown }) => {
          updatedData = data
        },
      },
    },
  })

  assert.deepEqual(updatedData, {
    examBanners: [{ banner: 7 }, { banner: 5 }, { banner: { id: 1, title: '기존 배너' } }],
  })
})

test('main banners expose center at the top of linked content tab', async () => {
  const linkedContentTab = getTabs(MainBanners).find((tab) => tab.label === '연결 콘텐츠')

  assert.ok(linkedContentTab, '연결 콘텐츠 탭이 있어야 합니다.')

  const [center] = linkedContentTab.fields as NamedField[]

  assert.equal(center?.name, 'center')
  assert.equal(center.type, 'select')
  assert.equal(center.label, '센터')
  assert.equal(center.admin?.position, undefined)
  assert.equal(await center.validate?.('', {}), '센터를 선택해야 합니다.')
})

test('main banners validate required fields and reservation range', async () => {
  const title = getField(MainBanners, 'title')
  const center = getField(MainBanners, 'center')
  const status = getField(MainBanners, 'status')
  const desktopImage = getField(MainBanners, 'desktopImage')
  const publishStartAt = getField(MainBanners, 'publishStartAt')
  const publishEndAt = getField(MainBanners, 'publishEndAt')

  assert.equal(await title.validate?.('', {}), '제목을 입력해야 합니다.')
  assert.equal(await center.validate?.('', {}), '센터를 선택해야 합니다.')
  assert.equal(await status.validate?.('', {}), '상태를 선택해야 합니다.')
  assert.equal(await desktopImage.validate?.(null, {}), '데스크톱 이미지를 선택해야 합니다.')
  assert.equal(publishStartAt.defaultValue instanceof Function, true)
  assert.equal(
    await publishStartAt.validate?.(null, {
      siblingData: {
        useReservation: true,
      },
    }),
    '예약 시작일을 선택해야 합니다.',
  )
  assert.equal(
    await publishEndAt.validate?.(null, {
      siblingData: {
        useReservation: true,
      },
    }),
    '예약 종료일을 선택해야 합니다.',
  )
  assert.equal(
    await publishEndAt.validate?.('2026-05-01T00:00:00.000Z', {
      siblingData: {
        publishStartAt: '2026-05-02T00:00:00.000Z',
        useReservation: true,
      },
    }),
    '종료일은 시작일보다 빠를 수 없습니다.',
  )
  assert.equal(
    await publishEndAt.validate?.('2026-05-01T00:00:00.000Z', {
      siblingData: {
        publishStartAt: '2026-05-02T00:00:00.000Z',
        useReservation: false,
      },
    }),
    true,
  )
})
