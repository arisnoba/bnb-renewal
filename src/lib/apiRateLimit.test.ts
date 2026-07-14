import assert from 'node:assert/strict'
import test from 'node:test'

import {
  consumeRateLimit,
  rateLimitHeaders,
  resolveRateLimitIdentifier,
} from './apiRateLimit'

test('resolveRateLimitIdentifier prefers authenticated users and trusted proxy headers', () => {
  const headers = new Headers({
    'cf-connecting-ip': '198.51.100.20',
    'x-forwarded-for': '198.51.100.30, 10.0.0.1',
    'x-vercel-forwarded-for': '198.51.100.10, 10.0.0.2',
  })

  assert.equal(resolveRateLimitIdentifier(headers, 42), 'user:42')
  assert.equal(resolveRateLimitIdentifier(headers), 'ip:198.51.100.10')
})

test('resolveRateLimitIdentifier rejects malformed forwarded values', () => {
  const headers = new Headers({ 'x-forwarded-for': 'spoofed-value' })

  assert.equal(resolveRateLimitIdentifier(headers), 'ip:unknown')
})

test('consumeRateLimit blocks requests after the fixed-window limit', async () => {
  let count = 0
  let storedKey = ''
  const request = new Request('https://example.com/api/test', {
    headers: { 'x-vercel-forwarded-for': '203.0.113.5' },
  })
  const policy = { limit: 2, scope: 'test', windowMs: 60_000 }
  const store = async ({ key, resetAt }: { key: string; resetAt: number }) => {
    storedKey = key

    return {
      count: ++count,
      reset_at: resetAt,
    }
  }

  const first = await consumeRateLimit(request, policy, { now: 120_000, store })
  const second = await consumeRateLimit(request, policy, { now: 120_000, store })
  const third = await consumeRateLimit(request, policy, { now: 120_000, store })

  assert.equal(first.allowed, true)
  assert.equal(second.remaining, 0)
  assert.equal(third.allowed, false)
  assert.equal(storedKey.includes('203.0.113.5'), false)
  assert.deepEqual(rateLimitHeaders(third), {
    'Retry-After': '60',
    'X-RateLimit-Limit': '2',
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': '180',
  })
})
