import assert from 'node:assert/strict'
import test from 'node:test'

import {
  customerServiceHourDetails,
  customerServiceHoursForCenter,
  customerServiceHoursSummary,
} from './customerServiceHours'

test('하이틴·입시·키즈센터는 변경된 CS 센터 운영시간을 사용한다', () => {
  for (const center of ['highteen', 'exam', 'kids'] as const) {
    assert.deepEqual(customerServiceHoursForCenter(center), {
      lunch: '12:00~13:00',
      weekday: '10:00~19:00',
      weekend: '10:00~19:00',
    })
    assert.deepEqual(customerServiceHourDetails(center), [
      { label: '평일', value: '10:00~19:00 / 점심시간 12:00~13:00' },
      { label: '주말', value: '10:00~19:00' },
    ])
    assert.equal(
      customerServiceHoursSummary(center),
      '평일 10:00~19:00 · 점심시간 12:00~13:00 · 주말 10:00~19:00',
    )
  }
})

test('아트·애비뉴센터와 센터가 없는 화면은 기존 운영시간을 유지한다', () => {
  for (const center of ['art', 'avenue'] as const) {
    assert.deepEqual(customerServiceHoursForCenter(center), {
      lunch: '12:00 ~ 13:00',
      weekday: '09:30 ~ 19:30',
      weekend: '09:30 ~ 16:00',
    })
    assert.equal(
      customerServiceHoursSummary(center),
      '평일 09:30 ~ 19:30 · 주말 09:30 ~ 16:00',
    )
  }

  assert.equal(
    customerServiceHoursSummary(null),
    '평일 09:30 ~ 19:30 · 주말 09:30 ~ 16:00',
  )
})
