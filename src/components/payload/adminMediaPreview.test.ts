import assert from 'node:assert/strict'
import test from 'node:test'

import { getAdminMediaPreviewSrc } from './adminMediaPreview'

test('admin media preview prefers the original media URL over generated thumbnail URL', () => {
  assert.equal(
    getAdminMediaPreviewSrc({
      thumbnailURL: '/api/media/file/mkkdy001-thumbnail.webp?prefix=media/screen-appearances/body-images/123',
      url: '/api/media/file/mkkdy001.webp?prefix=media/screen-appearances/body-images/123',
    }),
    '/api/admin-images?key=media%2Fscreen-appearances%2Fbody-images%2F123%2Fmkkdy001.webp',
  )
})

test('admin media preview falls back to thumbnail URL when URL is empty', () => {
  assert.equal(
    getAdminMediaPreviewSrc({
      thumbnailURL: 'media/example.webp',
      url: '',
    }),
    '/api/admin-images?key=media%2Fexample.webp',
  )
})

test('admin media preview preserves absolute URLs', () => {
  assert.equal(
    getAdminMediaPreviewSrc({
      url: 'https://cdn.example.com/media/example.webp',
    }),
    'https://cdn.example.com/media/example.webp',
  )
})
