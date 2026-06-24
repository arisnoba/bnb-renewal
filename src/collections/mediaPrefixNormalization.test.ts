import assert from 'node:assert/strict'
import test from 'node:test'

import { isNewUploadPrefix } from './mediaPrefixNormalization'

test('media prefix normalization accepts legacy and current unassigned upload prefixes', () => {
  const rolePrefix = 'media/main-banners/desktop-videos'
  const mediaId = '24995'

  assert.equal(
    isNewUploadPrefix({
      currentPrefix: 'media/assets/24995',
      mediaId,
      rolePrefix,
    }),
    true,
  )
  assert.equal(
    isNewUploadPrefix({
      currentPrefix: 'media/uploads/24995',
      mediaId,
      rolePrefix,
    }),
    true,
  )
  assert.equal(
    isNewUploadPrefix({
      currentPrefix: 'media/main-banners/desktop-videos/24995',
      mediaId,
      rolePrefix,
    }),
    true,
  )
})

test('media prefix normalization leaves unrelated assigned prefixes untouched', () => {
  assert.equal(
    isNewUploadPrefix({
      currentPrefix: 'media/news/thumbnails/120',
      mediaId: '24995',
      rolePrefix: 'media/main-banners/desktop-videos',
    }),
    false,
  )
})
