import assert from 'node:assert/strict'
import test from 'node:test'

import { getMediaUrl } from './getMediaUrl'

const originalNodeEnv = process.env.NODE_ENV
const originalR2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL

test('getMediaUrl rewrites local media paths to the R2 public base in production', () => {
  setNodeEnv('production')
  process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev/'

  assert.equal(
    getMediaUrl('/media/exam-results/images/6/exam-result-image-6-large.jpg'),
    'https://pub.example.r2.dev/media/exam-results/images/6/exam-result-image-6-large.jpg',
  )
})

test('getMediaUrl preserves local media paths in development', () => {
  setNodeEnv('development')
  process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev/'

  assert.equal(
    getMediaUrl('/media/exam-results/images/6/exam-result-image-6-large.jpg'),
    '/media/exam-results/images/6/exam-result-image-6-large.jpg',
  )
})

test('getMediaUrl appends cache tags after production media rewrite', () => {
  setNodeEnv('production')
  process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev'

  assert.equal(
    getMediaUrl('/media/example.jpg?size=large', '2026-06-30T00:00:00.000Z'),
    'https://pub.example.r2.dev/media/example.jpg?size=large&2026-06-30T00%3A00%3A00.000Z',
  )
})

test('getMediaUrl preserves absolute media URLs in production', () => {
  setNodeEnv('production')
  process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev'

  assert.equal(
    getMediaUrl('https://cdn.example.com/media/example.jpg'),
    'https://cdn.example.com/media/example.jpg',
  )
})

test.after(() => {
  setNodeEnv(originalNodeEnv)

  if (originalR2PublicBaseUrl === undefined) {
    delete process.env.R2_PUBLIC_BASE_URL
  } else {
    process.env.R2_PUBLIC_BASE_URL = originalR2PublicBaseUrl
  }
})

function setNodeEnv(value: typeof process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  })
}
