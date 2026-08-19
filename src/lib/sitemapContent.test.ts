import assert from 'node:assert/strict'
import test from 'node:test'

import { buildPublishedSitemapEntries } from './sitemapContent'

test('buildPublishedSitemapEntries adds current-center news, teachers, and allowed artist details', () => {
  const shared = {
    centers: ['all'] as ('all')[],
    id: 10,
    publishedAt: '2026-08-18T00:00:00.000Z',
    slug: '공유 문서',
    updatedAt: '2026-08-19T00:00:00.000Z',
  }
  const entries = buildPublishedSitemapEntries({
    artistPress: [shared],
    center: 'art',
    news: [shared],
    teachers: [shared],
  })

  assert.deepEqual(
    entries.map((entry) => entry.url),
    [
      'https://art.baewooenm.com/news/10',
      'https://art.baewooenm.com/teachers/%EA%B3%B5%EC%9C%A0%20%EB%AC%B8%EC%84%9C',
      'https://art.baewooenm.com/artist-press/10',
    ]
  )
  assert.ok(entries.every((entry) => entry.lastModified === shared.updatedAt))
})

test('buildPublishedSitemapEntries respects hidden artist archives and center ownership', () => {
  const document = {
    centers: ['art'] as ('art')[],
    id: 10,
    slug: 'teacher',
    updatedAt: '2026-08-19T00:00:00.000Z',
  }
  const entries = buildPublishedSitemapEntries({
    artistPress: [document],
    center: 'kids',
    news: [document],
    teachers: [document],
  })

  assert.deepEqual(entries, [])
})
