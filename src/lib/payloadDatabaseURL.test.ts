import assert from 'node:assert/strict'
import { test } from 'node:test'

import { resolvePayloadDatabaseURL } from './payloadDatabaseURL'

test('uses pooled database URL on Vercel runtime', () => {
  assert.equal(
    resolvePayloadDatabaseURL({
      DATABASE_URL: 'postgres://pooled',
      DATABASE_URL_UNPOOLED: 'postgres://direct',
      VERCEL: '1',
    }),
    'postgres://pooled',
  )
})

test('uses direct database URL outside Vercel runtime', () => {
  assert.equal(
    resolvePayloadDatabaseURL({
      DATABASE_URL: 'postgres://pooled',
      DATABASE_URL_UNPOOLED: 'postgres://direct',
    }),
    'postgres://direct',
  )
})

test('falls back to local database URL without configured env', () => {
  assert.equal(
    resolvePayloadDatabaseURL({}),
    'postgres://postgres:postgres@127.0.0.1:5432/bnb_renewal',
  )
})
