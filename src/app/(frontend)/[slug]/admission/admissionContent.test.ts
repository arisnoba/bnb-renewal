import assert from 'node:assert/strict'
import test from 'node:test'

import { getAdmissionContent } from './admissionContent'

test('키즈센터 Class 안내는 등급제의 I·R·U·DA 4단계와 일치한다', () => {
  const classGuide = getAdmissionContent('kids').tuitionTables[0]

  assert.equal(classGuide?.title, 'Class 안내')
  assert.deepEqual(classGuide?.rows, [
    {
      className: '입문 I Class',
      course: '표현의 기초 (Intro)',
      target:
        '연기를 처음 배우는 수강생, 매체연기에 능숙하지 않은 수강생으로 레벨테스트 후 배정됩니다.',
    },
    {
      className: '중급 R Class',
      course: '감정을 담아내는 배우 (Refine)',
      target:
        'I Class 이수자 또는 타 연기학원에서 1년 이상 이수자, 매체촬영 경력이 있는 수강생을 대상으로 레벨테스트 후 배정됩니다.',
    },
    {
      className: '심화 U Class',
      course: '감정을 연결하는 배우 (Upgrade)',
      target:
        'R Class 이수자, 드라마/영화 등 현장촬영 경험자를 대상으로 레벨테스트 후 배정됩니다.',
    },
    {
      className: '전문 DA Class',
      course: '현장을 준비하는 배우 (Directing Actor)',
      target:
        'U Class 이수자, 매니지먼트 위탁배우, 드라마/영화/연극 주·조연 이상 경력자로 레벨테스트 후 배정됩니다.',
    },
  ])
})
