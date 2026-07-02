import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeAdminListURL } from './proxy'

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
