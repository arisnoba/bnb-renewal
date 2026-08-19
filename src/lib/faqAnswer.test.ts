import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeFaqAnswer } from './faqAnswer'

test('normalizeFaqAnswer replaces confirmed legacy paths with current center routes', () => {
  const answer = [
    '[위탁교육](/web/html/manage_list.php?mid=entertain)',
    '[교육진](https://www.baewoo.co.kr/web/html/teacher_list.php?mid=teacher)',
    '[커리큘럼](/web/html/class_curriculum.php)',
  ].join('\n')
  const normalized = normalizeFaqAnswer(answer, 'kids')

  assert.match(normalized, /kids\.baewooenm\.com\/entertainment/)
  assert.match(normalized, /kids\.baewooenm\.com\/teachers/)
  assert.match(normalized, /kids\.baewooenm\.com\/curriculum/)
  assert.doesNotMatch(normalized, /\/web\/html\//)
})

test('normalizeFaqAnswer removes the invalid area-code prefix from the representative number', () => {
  assert.equal(normalizeFaqAnswer('문의 02-1577-9929', 'art'), '문의 1577-9929')
})
