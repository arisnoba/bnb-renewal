import assert from 'node:assert/strict'
import test from 'node:test'

import { generateLlmsTxt } from './llmsTxt'

test('generateLlmsTxt creates a markdown llms.txt with absolute links', () => {
  const content = generateLlmsTxt({ baseUrl: 'https://example.com/' })

  assert.match(content, /^# 배우앤배움\n\n> /)
  assert.match(content, /\n## Primary Pages\n/)
  assert.match(content, /\n## Optional\n/)
  assert.doesNotMatch(content, /\]\(\//)

  const linkLines = content.split('\n').filter((line) => line.startsWith('- ['))

  assert.ok(linkLines.length >= 10)
  assert.ok(linkLines.length <= 30)

  for (const line of linkLines) {
    assert.match(line, /^- \[[^\]]+\]\(https:\/\/example\.com\/[^)]*\): .+/)
  }
})

test('generateLlmsTxt falls back to localhost when baseUrl is empty', () => {
  const content = generateLlmsTxt({ baseUrl: '' })

  assert.match(content, /\(http:\/\/localhost:3000\/\)/)
})
