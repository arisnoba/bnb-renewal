import assert from 'node:assert/strict'
import { test } from 'node:test'

import { retryTransientPostgresRead } from './retryTransientPostgresRead'

test('retries a transient PostgreSQL read once', async (t) => {
  let attempts = 0
  const warnings: unknown[][] = []
  t.mock.method(console, 'warn', (...args: unknown[]) => warnings.push(args))

  const result = await retryTransientPostgresRead(
    async () => {
      attempts += 1

      if (attempts === 1) {
        throw Object.assign(new Error('query failed'), {
          cause: Object.assign(new Error('Authentication timed out'), { code: '08P01' }),
        })
      }

      return 'ok'
    },
    { delayMs: 0, operation: 'test-read' }
  )

  assert.equal(result, 'ok')
  assert.equal(attempts, 2)
  assert.deepEqual(warnings, [
    ['[database] retrying transient PostgreSQL read', { operation: 'test-read', reason: '08P01' }],
  ])
})

test('does not retry a non-transient PostgreSQL error', async () => {
  let attempts = 0
  const error = Object.assign(new Error('column does not exist'), { code: '42703' })

  await assert.rejects(
    retryTransientPostgresRead(
      async () => {
        attempts += 1
        throw error
      },
      { delayMs: 0, operation: 'test-read' }
    ),
    error
  )

  assert.equal(attempts, 1)
})

test('returns the second transient PostgreSQL failure to the caller', async (t) => {
  let attempts = 0
  const error = Object.assign(new Error('Connection terminated unexpectedly'), {
    code: 'ECONNRESET',
  })
  t.mock.method(console, 'warn', () => undefined)

  await assert.rejects(
    retryTransientPostgresRead(
      async () => {
        attempts += 1
        throw error
      },
      { delayMs: 0, operation: 'test-read' }
    ),
    error
  )

  assert.equal(attempts, 2)
})
