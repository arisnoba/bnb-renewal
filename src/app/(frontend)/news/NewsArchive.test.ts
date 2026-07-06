import assert from 'node:assert/strict'
import test from 'node:test'

import { defaultNewsCategories, examNewsCategories } from '@/lib/newsCategories'

import { buildCategoryWhere } from './NewsArchive'

test('news archive category filters use enum-safe equals conditions', () => {
  const auditionCategory = defaultNewsCategories[0]
  const onAirCategory = defaultNewsCategories[2]
  const examResultsCategory = examNewsCategories[0]

  assert.deepEqual(buildCategoryWhere(auditionCategory.key, defaultNewsCategories), {
    category: {
      equals: auditionCategory.value,
    },
  })

  assert.deepEqual(buildCategoryWhere(onAirCategory.key, defaultNewsCategories), {
    category: {
      equals: onAirCategory.value,
    },
  })

  assert.deepEqual(buildCategoryWhere(examResultsCategory.key, examNewsCategories), {
    category: {
      equals: examResultsCategory.value,
    },
  })
})

test('news archive category filters ignore unknown category keys', () => {
  assert.equal(buildCategoryWhere('unknown-category', defaultNewsCategories), null)
})
