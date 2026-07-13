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

test('getMediaUrl rewrites local media paths to the R2 public base in development', () => {
  setNodeEnv('development')
  process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev/'

  assert.equal(
    getMediaUrl('/media/exam-results/images/6/exam-result-image-6-large.jpg'),
    'https://pub.example.r2.dev/media/exam-results/images/6/exam-result-image-6-large.jpg',
  )
})

test('getMediaUrl keeps the local media fallback in development without R2 config', () => {
  setNodeEnv('development')
  delete process.env.R2_PUBLIC_BASE_URL

  assert.equal(
    getMediaUrl('/api/media/file/image.jpg?prefix=media%2Fuploads%2F12'),
    '/media/image.jpg',
  )
})

test('getMediaUrl rewrites local media API paths with prefixes to the R2 public base', () => {
  setNodeEnv('development')
  process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev/'

  assert.equal(
    getMediaUrl('/api/media/file/image.jpg?prefix=media%2Fuploads%2F12'),
    'https://pub.example.r2.dev/media/uploads/12/image.jpg',
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

test('getMediaUrl rewrites absolute R2.dev media URLs to the configured public base', () => {
  setNodeEnv('production')
  process.env.R2_PUBLIC_BASE_URL = 'https://media.baewooenm.com'

  assert.equal(
    getMediaUrl(
      'https://pub-208a689495e44ad08f35a11dfe27d259.r2.dev/media/screen-appearances/thumbnails/465/screen-appearance-thumbnail-465.webp',
      '2026-07-06T06:40:39.484Z',
    ),
    'https://media.baewooenm.com/media/screen-appearances/thumbnails/465/screen-appearance-thumbnail-465.webp?2026-07-06T06%3A40%3A39.484Z',
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
