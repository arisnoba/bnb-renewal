import assert from 'node:assert/strict'
import test from 'node:test'

import configPromise from '../../payload.config'

const expectedLeadingGroups = [
  '컬렉션(삭제예정)',
  '메인설정',
  '회사정보',
  '교육',
  '캐스팅/오디션',
]

const expectedMainSettingCollections = [
  'main-banners',
  'social-links',
]

const expectedMainSettingGlobals = ['main', 'main-statistics']

const expectedCastingLastCollection = 'broadcast-stations'

test('payload admin collection groups keep the requested leading order', async () => {
  const config = await configPromise
  const groupOrder: string[] = []

  for (const collection of config.collections) {
    const group = collection.admin?.group

    if (typeof group === 'string' && !groupOrder.includes(group)) {
      groupOrder.push(group)
    }
  }

  assert.deepEqual(groupOrder.slice(0, expectedLeadingGroups.length), expectedLeadingGroups)
})

test('main setting collections keep the requested relative order', async () => {
  const config = await configPromise
  const mainSettingCollections = config.collections
    .filter((collection) => collection.admin?.group === '메인설정')
    .map((collection) => collection.slug)

  assert.deepEqual(mainSettingCollections, expectedMainSettingCollections)
  assert.deepEqual(
    config.globals
      .filter((global) => global.admin?.group === '메인설정')
      .map((global) => global.slug),
    expectedMainSettingGlobals,
  )
})

test('casting admin group keeps broadcast station settings at the bottom', async () => {
  const config = await configPromise
  const castingCollections = config.collections
    .filter((collection) => collection.admin?.group === '캐스팅/오디션')
    .map((collection) => collection.slug)

  assert.equal(castingCollections.at(-1), expectedCastingLastCollection)
})
