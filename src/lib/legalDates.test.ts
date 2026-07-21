import assert from 'node:assert/strict'
import test from 'node:test'

import { formatLegalDate, legalDateKey, sortByLegalDateDescending } from './legalDates'

test('시행일을 한국 날짜 기준 최신순으로 정렬한다', () => {
  const values = [
    { date: '2025-12-31T15:00:00.000Z', name: '2026-01-01 자정' },
    { date: '2026-02-01T00:00:00.000Z', name: '2026-02-01' },
    { date: null, name: '날짜 미정' },
    { date: '2026-01-01T12:00:00.000Z', name: '2026-01-01 정오' },
  ]

  assert.deepEqual(
    sortByLegalDateDescending(values, (value) => value.date).map((value) => value.name),
    ['2026-02-01', '2026-01-01 자정', '2026-01-01 정오', '날짜 미정'],
  )
})

test('UTC 시각이 달라도 같은 한국 시행일은 같은 날짜 키를 사용한다', () => {
  assert.equal(legalDateKey('2025-12-31T15:00:00.000Z'), '2026-01-01')
  assert.equal(legalDateKey('2026-01-01T12:00:00.000Z'), '2026-01-01')
  assert.equal(formatLegalDate('2025-12-31T15:00:00.000Z'), '2026. 1. 1.')
})
