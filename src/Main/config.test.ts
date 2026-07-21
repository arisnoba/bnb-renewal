import assert from 'node:assert/strict'
import test from 'node:test'

import type { Field, GlobalConfig, Tab } from 'payload'

import {
  Main,
  mainCenterPaths,
  normalizeMainBannerOrderData,
  restrictCenterMainUpdates,
} from './config'
import {
  mainBannerOrderBannerId,
  mainBannerOrderBannerTitle,
} from './rowLabelHelpers'

type NamedField = Field & {
  name: string
  admin?: {
    components?: {
      Field?: unknown
      RowLabel?: unknown
    }
    condition?: (
      data: Record<string, unknown>,
      siblingData: Record<string, unknown>,
      options: { user?: unknown },
    ) => unknown
    description?: unknown
    initCollapsed?: boolean
  }
  access?: {
    update?: (args: { req: { user?: unknown } }) => boolean | Promise<boolean>
  }
  defaultValue?: unknown
  fields?: Field[]
  labels?: unknown
  relationTo?: unknown
  validate?: (value: unknown, options: { siblingData?: Record<string, unknown> }) => unknown
}

function getTabs(global: GlobalConfig) {
  const tabsField = global.fields.find((field) => field.type === 'tabs') as
    | { tabs: Tab[] }
    | undefined

  assert.ok(tabsField, 'main global에 센터별 tabs 필드가 있어야 합니다.')

  return tabsField.tabs
}

function getTab(global: GlobalConfig, label: string) {
  const tab = getTabs(global).find((item) => item.label === label)

  assert.ok(tab, `main global에 ${label} 탭이 있어야 합니다.`)

  return tab
}

function getTabField(global: GlobalConfig, tabLabel: string, fieldName: string) {
  const tab = getTab(global, tabLabel)
  const field = tab.fields.find(
    (item): item is NamedField => 'name' in item && item.name === fieldName,
  )

  assert.ok(field, `main.${fieldName} 필드가 있어야 합니다.`)

  return field
}

function getNestedField(field: NamedField, fieldName: string) {
  const nestedField = field.fields?.find(
    (item): item is NamedField => 'name' in item && item.name === fieldName,
  )

  assert.ok(nestedField, `main.${field.name}.${fieldName} 필드가 있어야 합니다.`)

  return nestedField
}

test('main global exposes center-specific banner order arrays', async () => {
  assert.equal(Main.slug, 'main')
  assert.equal(Main.label, '배너 설정')
  assert.equal(Main.admin?.group, '메인설정')
  assert.equal(Main.hooks?.afterChange?.length, 1)

  for (const [tabLabel, fieldName] of [
    ['아트센터', 'artBanners'],
    ['입시센터', 'examBanners'],
    ['키즈센터', 'kidsBanners'],
    ['하이틴센터', 'highteenBanners'],
    ['애비뉴센터', 'avenueBanners'],
  ] as const) {
    const tab = getTab(Main, tabLabel)
    const namedFields = tab.fields.filter(
      (item): item is NamedField => 'name' in item,
    )
    const autoplay = namedFields[0]
    const autoplayDelay = namedFields[1]
    const field = getTabField(Main, tabLabel, fieldName)
    const banner = getNestedField(field, 'banner')
    const center = fieldName.replace('Banners', '')

    assert.equal(autoplay.name, fieldName.replace('Banners', 'BannerAutoplay'))
    assert.equal(autoplay.type, 'checkbox')
    assert.equal(await autoplay.access?.update?.({ req: { user: { role: 'manager', center } } }), true)
    assert.equal(await autoplay.access?.update?.({ req: { user: { role: 'manager', center: 'exam' } } }), center === 'exam')
    assert.equal(await autoplay.access?.update?.({ req: { user: { role: 'admin', center: 'exam' } } }), true)
    assert.equal(await autoplay.access?.update?.({ req: { user: { role: 'manager', permissionLevel: 80, center: 'exam' } } }), true)
    assert.equal(autoplay.label, '오토플레이')
    assert.equal(autoplay.defaultValue, true)
    assert.equal(autoplayDelay.name, fieldName.replace('Banners', 'BannerAutoplayDelay'))
    assert.equal(autoplayDelay.type, 'number')
    assert.equal(autoplayDelay.label, '전환속도(ms)')
    assert.equal(autoplayDelay.defaultValue, 5000)
    assert.equal(
      autoplayDelay.admin?.components?.Field,
      '@/components/payload/MainBannerAutoplayDelayField#MainBannerAutoplayDelayField',
    )
    assert.equal(
      await autoplayDelay.validate?.(0, {}),
      '전환속도는 0보다 큰 숫자로 입력해야 합니다.',
    )
    assert.equal(field.type, 'array')
    assert.equal(field.maxRows, 5)
    assert.equal(
      field.admin?.description,
      '최대 5개까지 등록할 수 있으며, 배열 순서가 실제 메인 노출 순서입니다. 신규 배너는 맨 앞에 추가되고, 5개를 초과하면 맨 뒤 배너가 목록에서 제외됩니다. 예약이 종료된 배너는 목록에 남아 있지만 사이트에는 노출되지 않습니다.',
    )
    assert.equal(await field.access?.update?.({ req: { user: { role: 'manager', center } } }), true)
    assert.equal(await field.access?.update?.({ req: { user: { role: 'manager', center: 'exam' } } }), center === 'exam')
    assert.equal(await field.access?.update?.({ req: { user: { role: 'admin', center: 'exam' } } }), true)
    assert.equal(await field.access?.update?.({ req: { user: { role: 'manager', permissionLevel: 80, center: 'exam' } } }), true)
    assert.equal(field.admin?.initCollapsed, true)
    assert.equal(field.admin?.components?.RowLabel, '@/Main/RowLabel#MainBannerOrderRowLabel')
    assert.equal(banner.type, 'relationship')
    assert.equal(banner.relationTo, 'main-banners')
    assert.equal(await banner.validate?.(null, {}), '배너를 선택해야 합니다.')
  }
})

test('main global center tabs open only the manager center for center managers', () => {
  const artTab = getTab(Main, '아트센터')
  const examTab = getTab(Main, '입시센터')

  assert.equal(
    artTab.admin?.condition?.({}, {}, { user: { role: 'manager', center: 'art' } } as never),
    true,
  )
  assert.equal(
    examTab.admin?.condition?.({}, {}, { user: { role: 'manager', center: 'art' } } as never),
    false,
  )
  assert.equal(
    examTab.admin?.condition?.({}, {}, { user: { role: 'admin', center: 'art' } } as never),
    true,
  )
  assert.equal(
    examTab.admin?.condition?.({}, {}, { user: { role: 'manager', permissionLevel: 80, center: 'art' } } as never),
    true,
  )
})

test('main global revalidates center home paths', () => {
  assert.deepEqual(mainCenterPaths(), ['/art', '/exam', '/kids', '/highteen', '/avenue'])
})

test('main banner order row label helpers resolve relationship titles and ids', () => {
  assert.equal(mainBannerOrderBannerTitle({ id: 1, title: '입시센터 메인 배너' }), '입시센터 메인 배너')
  assert.equal(
    mainBannerOrderBannerTitle({ relationTo: 'main-banners', value: { id: 2, title: '아트센터 메인 배너' } }),
    '아트센터 메인 배너',
  )
  assert.equal(mainBannerOrderBannerTitle({ label: '선택된 배너 라벨', value: 3 }), '선택된 배너 라벨')
  assert.equal(mainBannerOrderBannerTitle(4), '')

  assert.equal(mainBannerOrderBannerId(4), '4')
  assert.equal(mainBannerOrderBannerId({ id: 5, title: '배너' }), '5')
  assert.equal(mainBannerOrderBannerId({ relationTo: 'main-banners', value: { id: 6 } }), '6')
})

test('main global removes empty banner order rows before validation', () => {
  assert.deepEqual(
    normalizeMainBannerOrderData(
      {
        highteenBanners: [{ banner: 7 }],
      },
      {
        kidsBanners: [
          { banner: 3 },
          { id: 'empty-row' },
          { banner: { id: 5, title: '기존 키즈 배너' } },
        ],
      },
    ),
    {
      highteenBanners: [{ banner: 7 }],
      kidsBanners: [
        { banner: 3 },
        { banner: { id: 5, title: '기존 키즈 배너' } },
      ],
    },
  )
})

test('main global keeps only the first five banner order rows', () => {
  assert.deepEqual(
    normalizeMainBannerOrderData({
      artBanners: [
        { banner: 6 },
        { banner: 5 },
        { banner: 4 },
        { banner: 3 },
        { banner: 2 },
        { banner: 1 },
      ],
    }),
    {
      artBanners: [
        { banner: 6 },
        { banner: 5 },
        { banner: 4 },
        { banner: 3 },
        { banner: 2 },
      ],
    },
  )
})

test('main global preserves other center values for center managers', () => {
  const data = restrictCenterMainUpdates({
    context: {},
    data: {
      artBannerAutoplay: false,
      artBannerAutoplayDelay: 7000,
      artBanners: [{ banner: 11 }],
      examBannerAutoplay: false,
      examBannerAutoplayDelay: 3000,
      examBanners: [{ banner: 22 }],
    },
    global: Main as never,
    originalDoc: {
      artBannerAutoplay: true,
      artBannerAutoplayDelay: 5000,
      artBanners: [{ banner: 1 }],
      examBannerAutoplay: true,
      examBannerAutoplayDelay: 6000,
      examBanners: [{ banner: 2 }],
    },
    req: {
      user: {
        center: 'exam',
        role: 'manager',
      },
    },
  } as never) as Record<string, unknown>

  assert.equal(data.artBannerAutoplay, true)
  assert.equal(data.artBannerAutoplayDelay, 5000)
  assert.deepEqual(data.artBanners, [{ banner: 1 }])
  assert.equal(data.examBannerAutoplay, false)
  assert.equal(data.examBannerAutoplayDelay, 3000)
  assert.deepEqual(data.examBanners, [{ banner: 22 }])
})
