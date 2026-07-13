import assert from 'node:assert/strict'
import test from 'node:test'

import { publishedImageSrc } from './publishedImageSrc'

const originalR2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL

test('publishedImageSrc resolves legacy paths to the R2 public base', () => {
  process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev/'

  assert.equal(
    publishedImageSrc(
      '/legacy/profiles/kidscenter/new_profile/1013/3717534017_dx3sI7VH_c1f5be2fbf0c558dd712b87ecdc2eaa31e6d7cc1.jpg',
    ),
    'https://pub.example.r2.dev/legacy/profiles/kidscenter/new_profile/1013/3717534017_dx3sI7VH_c1f5be2fbf0c558dd712b87ecdc2eaa31e6d7cc1.jpg',
  )
})

test('publishedImageSrc resolves absolute legacy URLs by pathname', () => {
  process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev'

  assert.equal(
    publishedImageSrc('https://www.baewoo.net/legacy/profiles/kidscenter/new_profile/1013/photo.jpg'),
    'https://pub.example.r2.dev/legacy/profiles/kidscenter/new_profile/1013/photo.jpg',
  )
})

test('publishedImageSrc preserves existing media object key behavior', () => {
  process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev/'

  assert.equal(
    publishedImageSrc('media/profiles/profile-images/863/profile-image-863.jpg'),
    'https://pub.example.r2.dev/media/profiles/profile-images/863/profile-image-863.jpg',
  )
})

test('publishedImageSrc rewrites absolute R2.dev media URLs to the configured public base', () => {
  process.env.R2_PUBLIC_BASE_URL = 'https://media.baewooenm.com'

  assert.equal(
    publishedImageSrc(
      'https://pub-208a689495e44ad08f35a11dfe27d259.r2.dev/media/teachers/profile-images/48/song-minji.webp?updated=1',
    ),
    'https://media.baewooenm.com/media/teachers/profile-images/48/song-minji.webp?updated=1',
  )
})

test('publishedImageSrc preserves external URLs', () => {
  process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev'

  assert.equal(
    publishedImageSrc('https://assets.example.com/profile.jpg'),
    'https://assets.example.com/profile.jpg',
  )
})

test.after(() => {
  if (originalR2PublicBaseUrl === undefined) {
    delete process.env.R2_PUBLIC_BASE_URL
  } else {
    process.env.R2_PUBLIC_BASE_URL = originalR2PublicBaseUrl
  }
})
