import assert from 'node:assert/strict'
import test from 'node:test'

import { formatMultilineText } from './formatMultilineText'

test('formatMultilineText removes leading blank lines while preserving line breaks', () => {
  assert.equal(
    formatMultilineText(
      '\n\n  tvN 미니시리즈 [별똥별] 포토그래퍼 역\n  KBS2 수목드라마 [아이리스2] 보경호 역  ',
    ),
    'tvN 미니시리즈 [별똥별] 포토그래퍼 역\nKBS2 수목드라마 [아이리스2] 보경호 역',
  )
})

test('formatMultilineText normalizes br tags and empty values', () => {
  assert.equal(
    formatMultilineText('  [ATTENDEZ] 손님 역<br>[퇴행] 남자 역  '),
    '[ATTENDEZ] 손님 역\n[퇴행] 남자 역',
  )
  assert.equal(formatMultilineText(null), '')
})
