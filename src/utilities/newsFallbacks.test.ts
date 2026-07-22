import assert from 'node:assert/strict'
import test from 'node:test'

import { getNewsUrl } from './newsFallbacks'

test('news links use the canonical center subdomain', () => {
  assert.equal(getNewsUrl({ id: 123 }, 'art'), 'https://art.baewooenm.com/news/123')
  assert.equal(getNewsUrl({ id: 456 }, 'kids'), 'https://kids.baewooenm.com/news/456')
})
