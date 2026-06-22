import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { verifyTurnstileToken } from './turnstile'

const originalFetch = globalThis.fetch
const originalSecret = process.env.TURNSTILE_SECRET_KEY

afterEach(() => {
  globalThis.fetch = originalFetch

  if (originalSecret === undefined) {
    delete process.env.TURNSTILE_SECRET_KEY
  } else {
    process.env.TURNSTILE_SECRET_KEY = originalSecret
  }
})

test('verifyTurnstileToken reports missing secret without calling siteverify', async () => {
  delete process.env.TURNSTILE_SECRET_KEY
  globalThis.fetch = (() => {
    throw new Error('fetch should not be called')
  }) as typeof fetch

  const result = await verifyTurnstileToken('token')

  assert.deepEqual(result, {
    errorCodes: ['missing-secret-key'],
    success: false,
  })
})

test('verifyTurnstileToken converts siteverify network failures to verification failure', async () => {
  process.env.TURNSTILE_SECRET_KEY = 'secret'
  globalThis.fetch = (async () => {
    throw new Error('network failure')
  }) as typeof fetch

  const result = await verifyTurnstileToken('token')

  assert.deepEqual(result, {
    errorCodes: ['siteverify-request-failed'],
    success: false,
  })
})

test('verifyTurnstileToken converts invalid siteverify JSON to verification failure', async () => {
  process.env.TURNSTILE_SECRET_KEY = 'secret'
  globalThis.fetch = (async () => new Response('not json', { status: 200 })) as typeof fetch

  const result = await verifyTurnstileToken('token')

  assert.deepEqual(result, {
    errorCodes: ['siteverify-response-invalid'],
    success: false,
  })
})

test('verifyTurnstileToken returns Cloudflare verification result', async () => {
  process.env.TURNSTILE_SECRET_KEY = 'secret'
  globalThis.fetch = (async () =>
    Response.json({
      'error-codes': ['invalid-input-response'],
      success: false,
    })) as typeof fetch

  const result = await verifyTurnstileToken('token')

  assert.deepEqual(result, {
    errorCodes: ['invalid-input-response'],
    success: false,
  })
})
