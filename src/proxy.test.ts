import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'

import { canonicalAdminURL, normalizeAdminListURL, proxy, routingURL } from './proxy'

test('routing URL restores the public host and protocol from proxy headers', () => {
  const request = {
    headers: new Headers({
      host: 'localhost:3000',
      'x-forwarded-host': 'exam.baewooenm.com',
      'x-forwarded-proto': 'https',
    }),
    url: 'http://localhost:3000/teachers?page=2',
  }

  assert.equal(routingURL(request).href, 'https://exam.baewooenm.com/teachers?page=2')
})

test('proxy redirects legacy PHP routes before center-domain rewrites', () => {
  const request = new NextRequest(
    'http://localhost:3000/web/bbs/content.php?co_id=parents',
    {
      headers: {
        host: 'localhost:3000',
        'x-forwarded-host': 'baewoo.co.kr',
        'x-forwarded-proto': 'https',
      },
    },
  )
  const response = proxy(request)

  assert.equal(response.status, 308)
  assert.equal(
    response.headers.get('location'),
    'https://art.baewooenm.com/company#company-affiliates',
  )
})

test('center-domain admin routes redirect to the canonical www host', () => {
  const adminURL = canonicalAdminURL(
    new URL('https://exam.baewooenm.com/admin/collections/news?page=2'),
  )

  assert.equal(
    adminURL?.href,
    'https://www.baewooenm.com/admin/collections/news?page=2',
  )
  assert.equal(
    canonicalAdminURL(new URL('https://baewooenm.com/admin/login'))?.href,
    'https://www.baewooenm.com/admin/login',
  )
  assert.equal(canonicalAdminURL(new URL('https://www.baewooenm.com/admin')), undefined)
  assert.equal(canonicalAdminURL(new URL('https://exam.baewooenm.com/news')), undefined)
  assert.equal(canonicalAdminURL(new URL('https://preview.example.com/admin')), undefined)
})

test('single-center admin lists rewrite stale contains center filters', () => {
  const url = new URL(
    'http://localhost:3000/admin/collections/screen-appearances?where[or][0][centers][contains]=art&where[or][1][centers][contains]=all&sort=name',
  )
  const normalized = normalizeAdminListURL(url)

  assert.ok(normalized)
  assert.equal(normalized.searchParams.get('where[or][0][centers][contains]'), null)
  assert.equal(normalized.searchParams.get('where[or][0][centers][equals]'), 'art')
  assert.equal(normalized.searchParams.get('where[or][1][centers][contains]'), null)
  assert.equal(normalized.searchParams.get('where[or][1][centers][equals]'), null)
  assert.equal(normalized.searchParams.get('sort'), 'name')

  const curriculumURL = new URL(
    'http://localhost:3000/admin/collections/curriculums?where[centers][contains]=exam',
  )
  const normalizedCurriculumURL = normalizeAdminListURL(curriculumURL)

  assert.ok(normalizedCurriculumURL)
  assert.equal(normalizedCurriculumURL.searchParams.get('where[centers][contains]'), null)
  assert.equal(normalizedCurriculumURL.searchParams.get('where[centers][equals]'), 'exam')
})

test('single-center admin lists drop stale all-center contains filters', () => {
  const url = new URL(
    'http://localhost:3000/admin/collections/screen-appearances?where[centers][contains]=all&sort=-publishedAt',
  )
  const normalized = normalizeAdminListURL(url)

  assert.ok(normalized)
  assert.equal(normalized.searchParams.get('where[centers][contains]'), null)
  assert.equal(normalized.searchParams.get('where[centers][equals]'), null)
  assert.equal(normalized.searchParams.get('sort'), '-publishedAt')
})

test('multi-center admin list URLs are left unchanged', () => {
  const url = new URL(
    'http://localhost:3000/admin/collections/profiles?where[or][0][centers][contains]=art',
  )

  assert.equal(normalizeAdminListURL(url), undefined)
})
