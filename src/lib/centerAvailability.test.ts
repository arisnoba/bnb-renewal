import assert from 'node:assert/strict'
import test from 'node:test'

import {
  centerPreparationTitle,
  centerPublicStatuses,
  isCenterPreparationPathname,
  isCenterPubliclyAvailable,
} from './centerAvailability'
import { centers } from './centers'

test('every center has an explicit public availability status', () => {
  assert.deepEqual(Object.keys(centerPublicStatuses).sort(), Object.keys(centers).sort())
})

test('avenue is preparing while the other centers remain publicly available', () => {
  assert.equal(isCenterPubliclyAvailable('avenue'), false)

  for (const center of ['art', 'exam', 'highteen', 'kids'] as const) {
    assert.equal(isCenterPubliclyAvailable(center), true)
  }
})

test('preparation title uses the public center label', () => {
  assert.equal(centerPreparationTitle('avenue'), '애비뉴센터 오픈을 준비하고 있습니다.')
})

test('preparation pathname detection covers public and internal routes', () => {
  assert.equal(isCenterPreparationPathname('/avenue'), true)
  assert.equal(isCenterPreparationPathname('/avenue/news'), true)
  assert.equal(isCenterPreparationPathname('/opening-soon/avenue'), true)
  assert.equal(isCenterPreparationPathname('/art'), false)
  assert.equal(isCenterPreparationPathname('/'), false)
})
