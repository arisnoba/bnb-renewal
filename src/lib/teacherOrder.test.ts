import assert from 'node:assert/strict'
import test from 'node:test'

import {
  moveTeacherOrderItem,
  teacherBelongsToOrderCenter,
  teacherOrderFieldName,
  teacherOrderValue,
} from './teacherOrder'

test('센터별 강사 정렬 필드명을 반환한다', () => {
  assert.equal(teacherOrderFieldName('art'), 'artDisplayOrder')
  assert.equal(teacherOrderFieldName('exam'), 'examDisplayOrder')
  assert.equal(teacherOrderFieldName('kids'), 'kidsDisplayOrder')
  assert.equal(teacherOrderFieldName('highteen'), 'highteenDisplayOrder')
  assert.equal(teacherOrderFieldName('avenue'), 'avenueDisplayOrder')
})

test('ALL 강사는 모든 센터의 정렬 대상이다', () => {
  assert.equal(teacherBelongsToOrderCenter(['all'], 'art'), true)
  assert.equal(teacherBelongsToOrderCenter(['all'], 'avenue'), true)
  assert.equal(teacherBelongsToOrderCenter(['art', 'kids'], 'exam'), false)
})

test('센터별 정렬값을 우선하고 기존 정렬값을 안전망으로 사용한다', () => {
  assert.equal(teacherOrderValue({ artDisplayOrder: 3, displayOrder: 8 }, 'art'), 3)
  assert.equal(teacherOrderValue({ displayOrder: 8 }, 'art'), 8)
  assert.equal(teacherOrderValue({}, 'art'), null)
})

test('드래그한 강사를 지정한 위치로 이동한다', () => {
  const teachers = ['가', '나', '다', '라']

  assert.deepEqual(moveTeacherOrderItem(teachers, 0, 2), ['나', '다', '가', '라'])
  assert.equal(moveTeacherOrderItem(teachers, -1, 2), teachers)
})
