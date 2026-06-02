import assert from 'node:assert/strict'
import test from 'node:test'

import type { Field, GlobalConfig, Tab } from 'payload'

import { Main } from './config'

type NamedField = Field & {
  name: string
  admin?: {
    components?: {
      Field?: unknown
      RowLabel?: unknown
    }
    description?: unknown
    initCollapsed?: boolean
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
  assert.equal(Main.admin?.group, '메인 설정')

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

    assert.equal(autoplay.name, fieldName.replace('Banners', 'BannerAutoplay'))
    assert.equal(autoplay.type, 'checkbox')
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
    assert.equal(field.admin?.initCollapsed, true)
    assert.equal(field.admin?.components?.RowLabel, '@/Main/RowLabel#MainBannerOrderRowLabel')
    assert.equal(banner.type, 'relationship')
    assert.equal(banner.relationTo, 'main-banners')
    assert.equal(await banner.validate?.(null, {}), '배너를 선택해야 합니다.')
  }
})
