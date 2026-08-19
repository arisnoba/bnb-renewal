import assert from 'node:assert/strict'
import test from 'node:test'

import { generateLlmsTxt } from './llmsTxt'

test('generateLlmsTxt creates a markdown llms.txt with absolute links', () => {
  const content = generateLlmsTxt({ baseUrl: 'https://www.baewooenm.com/' })

  assert.match(content, /^# 배우앤배움\n\n> /)
  assert.match(content, /\n## Primary Pages\n/)
  assert.match(content, /\n## Optional\n/)
  assert.doesNotMatch(content, /\]\(\//)

  const linkLines = content.split('\n').filter((line) => line.startsWith('- ['))

  assert.ok(linkLines.length >= 10)
  assert.ok(linkLines.length <= 30)

  for (const line of linkLines) {
    assert.match(
      line,
      /^- \[[^\]]+\]\(https:\/\/(?:www|art|avenue|exam|highteen|kids)\.baewooenm\.com\/[^)]*\): .+/,
    )
  }

  assert.match(content, /https:\/\/art\.baewooenm\.com\/grade-system/)
  assert.doesNotMatch(content, /https:\/\/www\.baewooenm\.com\/(?:art|avenue|exam|highteen|kids)(?:\/|\))/)
})

test('generateLlmsTxt falls back to localhost when baseUrl is empty', () => {
  const content = generateLlmsTxt({ baseUrl: '' })

  assert.match(content, /\(http:\/\/localhost:3000\/\)/)
})

test('generateLlmsTxt prioritizes the requested center and uses direct legal URLs', () => {
  const content = generateLlmsTxt({
    baseUrl: 'https://kids.baewooenm.com',
    center: 'kids',
  })

  assert.match(content, /^# 배우앤배움 키즈센터/)
  assert.match(content, /https:\/\/kids\.baewooenm\.com\/teachers/)
  assert.match(content, /https:\/\/kids\.baewooenm\.com\/privacy/)
  assert.match(content, /https:\/\/kids\.baewooenm\.com\/terms/)
  assert.doesNotMatch(content, /https:\/\/art\.baewooenm\.com\/grade-system/)
})
