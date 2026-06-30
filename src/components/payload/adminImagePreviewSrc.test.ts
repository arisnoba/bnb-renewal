import assert from 'node:assert/strict'
import test from 'node:test'

import { getAdminImagePreviewSrc } from './adminImagePreviewSrc'

test('resolves stored R2 media object keys through the admin image preview route', () => {
  assert.equal(
    getAdminImagePreviewSrc('media/casting-appearances/images/293/casting-appearance-image-293-large.jpg'),
    '/api/admin-images?key=media%2Fcasting-appearances%2Fimages%2F293%2Fcasting-appearance-image-293-large.jpg',
  )
})

test('resolves slash-prefixed R2 media paths through the admin image preview route', () => {
  assert.equal(
    getAdminImagePreviewSrc('/media/casting-appearances/images/293/casting appearance.jpg'),
    '/api/admin-images?key=media%2Fcasting-appearances%2Fimages%2F293%2Fcasting%20appearance.jpg',
  )
})

test('resolves Payload API media URLs with prefixes through the admin image preview route', () => {
  assert.equal(
    getAdminImagePreviewSrc('/api/media/file/image.jpg?prefix=media%2Fcasting-appearances%2Fimages%2F293'),
    '/api/admin-images?key=media%2Fcasting-appearances%2Fimages%2F293%2Fimage.jpg',
  )
})

test('resolves legacy R2 object keys through the admin image preview route', () => {
  assert.equal(
    getAdminImagePreviewSrc('/legacy/casting-appearances/baewoo/new_appear/167/thumbnail/image.png'),
    '/api/admin-images?key=legacy%2Fcasting-appearances%2Fbaewoo%2Fnew_appear%2F167%2Fthumbnail%2Fimage.png',
  )
})

test('preserves absolute public image URLs', () => {
  assert.equal(
    getAdminImagePreviewSrc('https://pub.example.r2.dev/media/casting-appearances/images/293/image.jpg'),
    'https://pub.example.r2.dev/media/casting-appearances/images/293/image.jpg',
  )
})

test('preserves app-handled upload URLs', () => {
  assert.equal(
    getAdminImagePreviewSrc('/uploads/admin-images/2026/06/image.jpg'),
    '/uploads/admin-images/2026/06/image.jpg',
  )
})
