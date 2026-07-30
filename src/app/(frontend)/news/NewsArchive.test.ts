import assert from 'node:assert/strict'
import test from 'node:test'

import {
  defaultNewsCategories,
  examNewsCategories,
  getNewsCategoriesForCenter,
} from '@/lib/newsCategories'

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

test('center-specific news categories use their allowed options', () => {
  assert.equal(
    buildCategoryWhere('admission-schedule', getNewsCategoriesForCenter('exam')),
    null,
  )
  assert.deepEqual(
    buildCategoryWhere('casting-onair', getNewsCategoriesForCenter('highteen')),
    {
      category: {
        equals: '캐스팅OnAir',
      },
    },
  )
  assert.deepEqual(
    buildCategoryWhere('casting-onair', getNewsCategoriesForCenter('art')),
    {
      category: {
        equals: '캐스팅OnAir',
      },
    },
  )
})
