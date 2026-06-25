import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  resolvePayloadDatabasePoolMax,
  resolvePayloadDatabaseURL,
} from './payloadDatabaseURL'

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

test('uses conservative pooled connection count on Vercel runtime', () => {
  assert.equal(resolvePayloadDatabasePoolMax({ VERCEL: '1' }), 3)
})

test('allows overriding payload database pool max', () => {
  assert.equal(
    resolvePayloadDatabasePoolMax({
      PAYLOAD_DATABASE_POOL_MAX: '3',
      VERCEL: '1',
    }),
    3,
  )
})

test('does not set payload database pool max outside Vercel runtime', () => {
  assert.equal(resolvePayloadDatabasePoolMax({}), undefined)
})

test('ignores invalid payload database pool max override', () => {
  assert.equal(
    resolvePayloadDatabasePoolMax({
      PAYLOAD_DATABASE_POOL_MAX: '3abc',
      VERCEL: '1',
    }),
    3,
  )
})
