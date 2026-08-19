import assert from 'node:assert/strict'
import test from 'node:test'

import type { Curriculum, News, Teacher } from '@/payload-types'

import {
  buildCourseStructuredData,
  buildNewsStructuredData,
  buildSiteStructuredData,
  buildTeacherStructuredData,
  centerOrganizationId,
} from './structuredData'

test('site structured data connects the company, brand, website, and center entities', () => {
  const data = buildSiteStructuredData('exam')
  const graph = data['@graph']

  assert.equal(graph.length, 4)
  assert.ok(graph.some((entity) => entity['@id'] === centerOrganizationId('exam')))
  assert.ok(graph.some((entity) => entity['@type'] === 'WebSite'))
})

test('primary site structured data includes all five center organizations', () => {
  const graph = buildSiteStructuredData(null)['@graph']
  const centerIds = (['art', 'avenue', 'exam', 'highteen', 'kids'] as const).map((center) =>
    centerOrganizationId(center),
  )

  assert.ok(centerIds.every((id) => graph.some((entity) => entity['@id'] === id)))
})

test('news structured data exposes the existing code fields without visible byline markup', () => {
  const news = {
    authorName: '실제 관리자명',
    centers: ['art'],
    createdAt: '2026-08-17T00:00:00.000Z',
    id: 6399,
    publishedAt: '2026-08-18T00:00:00.000Z',
    slug: '6399',
    title: 'Talk with BNB Q&A',
    updatedAt: '2026-08-19T00:00:00.000Z',
  } as News
  const data = buildNewsStructuredData(news, 'art')
  const article = data['@graph'][0]

  assert.equal(article['@type'], 'Article')
  assert.deepEqual(article.author, {
    '@type': 'Person',
    name: '센터 관리자',
    worksFor: { '@id': centerOrganizationId('art') },
  })
  assert.deepEqual(article.publisher, { '@id': centerOrganizationId('art') })
  assert.equal(article.datePublished, news.publishedAt)
  assert.equal(article.dateModified, news.updatedAt)
  assert.equal(article.url, 'https://art.baewooenm.com/news/6399')
})

test('teacher and curriculum structured data add their entity and breadcrumb types', () => {
  const teacher = {
    centers: ['kids'],
    createdAt: '2026-08-18T00:00:00.000Z',
    id: 1,
    name: '홍길동',
    profileImageMedia: 1,
    slug: '홍길동',
    updatedAt: '2026-08-19T00:00:00.000Z',
  } as Teacher
  const curriculum = {
    centers: 'kids',
    createdAt: '2026-08-18T00:00:00.000Z',
    id: 2,
    slug: '2',
    title: '아역배우 Class',
    updatedAt: '2026-08-19T00:00:00.000Z',
  } as Curriculum

  assert.deepEqual(
    buildTeacherStructuredData(teacher, 'kids')['@graph'].map((entity) => entity['@type']),
    ['Person', 'BreadcrumbList'],
  )
  assert.deepEqual(
    buildCourseStructuredData(curriculum, 'kids')['@graph'].map((entity) => entity['@type']),
    ['Course', 'BreadcrumbList'],
  )
})
