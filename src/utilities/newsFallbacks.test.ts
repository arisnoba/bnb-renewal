import assert from 'node:assert/strict'
import test from 'node:test'

import { getNewsDetailThumbnailMedia, getNewsUrl } from './newsFallbacks'

test('news links use the canonical center subdomain', () => {
  assert.equal(getNewsUrl({ id: 123 }, 'art'), 'https://art.baewooenm.com/news/123')
  assert.equal(getNewsUrl({ id: 456 }, 'kids'), 'https://kids.baewooenm.com/news/456')
})

test('news detail only returns the representative image when automatic insertion is checked', () => {
  const thumbnailMedia = { id: 123 }

  assert.equal(
    getNewsDetailThumbnailMedia({
      showThumbnailOnDetail: false,
      thumbnailMedia: thumbnailMedia as never,
    }),
    undefined,
  )
  assert.equal(
    getNewsDetailThumbnailMedia({
      showThumbnailOnDetail: true,
      thumbnailMedia: thumbnailMedia as never,
    }),
    thumbnailMedia,
  )
})
