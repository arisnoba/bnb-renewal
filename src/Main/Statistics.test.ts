import assert from 'node:assert/strict'
import test from 'node:test'

import type { Field, GlobalConfig, Tab } from 'payload'

import { MainStatistics, restrictCenterStatisticUpdates } from './Statistics'

type NamedField = Field & {
  defaultValue?: unknown
  fields?: Field[]
  label?: unknown
  min?: unknown
  name: string
  access?: {
    update?: (args: { req: { user?: unknown } }) => boolean | Promise<boolean>
  }
  validate?: (value: unknown) => unknown
}

function getTabs(global: GlobalConfig) {
  const tabsField = global.fields.find((field) => field.type === 'tabs') as
    | { tabs: Tab[] }
    | undefined

  assert.ok(tabsField, 'main-statistics global에 센터별 tabs 필드가 있어야 합니다.')

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

function getTab(global: GlobalConfig, label: string) {
  const tab = getTabs(global).find((item) => item.label === label)

  assert.ok(tab, `main-statistics global에 ${label} 탭이 있어야 합니다.`)

  return tab
}

function getTabField(global: GlobalConfig, tabLabel: string, fieldName: string) {
  const tab = getTab(global, tabLabel)
  const field = findField(tab.fields, fieldName)

  assert.ok(field, `main-statistics.${fieldName} 필드가 있어야 합니다.`)

  return field
}

test('main statistics are configured as one settings global with center-specific fields', async () => {
  assert.equal(MainStatistics.slug, 'main-statistics')
  assert.equal(MainStatistics.label, '통계 설정')
  assert.equal(MainStatistics.admin?.group, '메인설정')
  assert.deepEqual(MainStatistics.versions, { max: 15 })

  for (const [tabLabel, center] of [
    ['아트센터', 'art'],
    ['입시센터', 'exam'],
    ['키즈센터', 'kids'],
    ['하이틴센터', 'highteen'],
    ['애비뉴센터', 'avenue'],
  ] as const) {
    const totalWorkCount = getTabField(MainStatistics, tabLabel, `${center}TotalWorkCount`)
    const auditionCount = getTabField(MainStatistics, tabLabel, 'auditionCount')
    const directorMeetingCount = getTabField(MainStatistics, tabLabel, 'directorMeetingCount')
    const listupCount = getTabField(MainStatistics, tabLabel, 'listupCount')
    const castingConfirmedCount = getTabField(MainStatistics, tabLabel, 'castingConfirmedCount')

    assert.equal(totalWorkCount.label, '누적 작품 수')

    for (const field of [
      totalWorkCount,
      auditionCount,
      directorMeetingCount,
      listupCount,
      castingConfirmedCount,
    ]) {
      assert.equal(field.type, 'number')
      assert.equal(await field.access?.update?.({ req: { user: { role: 'manager', center } } }), true)
      assert.equal(await field.access?.update?.({ req: { user: { role: 'manager', center: 'exam' } } }), center === 'exam')
      assert.equal(await field.access?.update?.({ req: { user: { role: 'admin', center: 'exam' } } }), true)
      assert.equal(field.defaultValue, 0)
      assert.equal(field.min, 0)
      assert.equal(await field.validate?.(0), true)
      assert.equal(await field.validate?.(1), true)
      assert.equal(await field.validate?.(-1), '0 이상의 정수로 입력해야 합니다.')
      assert.equal(await field.validate?.(1.5), '0 이상의 정수로 입력해야 합니다.')
      assert.equal(await field.validate?.(''), '0 이상의 정수로 입력해야 합니다.')
    }
  }
})

test('main statistics center tabs open only the manager center for center managers', () => {
  const artTab = getTab(MainStatistics, '아트센터')
  const highteenTab = getTab(MainStatistics, '하이틴센터')

  assert.equal(
    artTab.admin?.condition?.({}, {}, { user: { role: 'manager', center: 'art' } } as never),
    true,
  )
  assert.equal(
    highteenTab.admin?.condition?.({}, {}, { user: { role: 'manager', center: 'art' } } as never),
    false,
  )
  assert.equal(
    highteenTab.admin?.condition?.({}, {}, { user: { role: 'admin', center: 'art' } } as never),
    true,
  )
})

test('main statistics preserve other center values for center managers', () => {
  const data = restrictCenterStatisticUpdates({
    context: {},
    data: {
      artTotalWorkCount: 11,
      examTotalWorkCount: 22,
      kidsTotalWorkCount: 33,
      kidsMonthlyLeadSupporting: {
        auditionCount: 34,
        directorMeetingCount: 35,
      },
      kidsMonthlyMinorExtra: {
        castingConfirmedCount: 37,
        listupCount: 36,
      },
    },
    global: MainStatistics as never,
    originalDoc: {
      artTotalWorkCount: 1,
      examTotalWorkCount: 2,
      kidsTotalWorkCount: 3,
      kidsMonthlyLeadSupporting: {
        auditionCount: 4,
        directorMeetingCount: 5,
      },
      kidsMonthlyMinorExtra: {
        castingConfirmedCount: 7,
        listupCount: 6,
      },
    },
    req: {
      user: {
        center: 'kids',
        role: 'manager',
      },
    },
  } as never) as Record<string, unknown>

  assert.equal(data.artTotalWorkCount, 1)
  assert.equal(data.examTotalWorkCount, 2)
  assert.equal(data.kidsTotalWorkCount, 33)
  assert.deepEqual(data.kidsMonthlyLeadSupporting, {
    auditionCount: 34,
    directorMeetingCount: 35,
  })
  assert.deepEqual(data.kidsMonthlyMinorExtra, {
    castingConfirmedCount: 37,
    listupCount: 36,
  })
})

test('main statistics allow global admins to update every center', () => {
  const data = {
    artTotalWorkCount: 11,
    examTotalWorkCount: 22,
  }

  assert.equal(
    restrictCenterStatisticUpdates({
      context: {},
      data,
      global: MainStatistics as never,
      originalDoc: {
        artTotalWorkCount: 1,
        examTotalWorkCount: 2,
      },
      req: {
        user: {
          center: 'kids',
          role: 'admin',
        },
      },
    } as never),
    data,
  )
})
