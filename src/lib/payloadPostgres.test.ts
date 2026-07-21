import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { payloadPostgres, PayloadPostgresPool } from './payloadPostgres'

const originalVercel = process.env.VERCEL

afterEach(() => {
  if (originalVercel === undefined) {
    delete process.env.VERCEL
  } else {
    process.env.VERCEL = originalVercel
  }
})

test('handles idle client errors without throwing an uncaught exception', async (t) => {
  delete process.env.VERCEL

  const messages: unknown[][] = []
  t.mock.method(console, 'error', (...args: unknown[]) => {
    messages.push(args)
  })

  const pool = new payloadPostgres.Pool({ max: 1 })
  const error = Object.assign(
    new Error('terminating connection due to administrator command'),
    { code: '57P01' },
  )

  assert.doesNotThrow(() => pool.emit('error', error))
  assert.ok(pool instanceof PayloadPostgresPool)
  assert.equal(pool.listenerCount('release'), 0)
  assert.deepEqual(messages, [
    [
      '[database] idle PostgreSQL client was removed from the pool',
      {
        code: '57P01',
        message: 'terminating connection due to administrator command',
      },
    ],
  ])

  await pool.end()
})

test('attaches Vercel database lifecycle handling on Vercel', async () => {
  process.env.VERCEL = '1'

  let attachedPool: PayloadPostgresPool | undefined
  const pool = new PayloadPostgresPool(
    { idleTimeoutMillis: 5_000, max: 1 },
    (candidate) => {
      attachedPool = candidate as PayloadPostgresPool
    },
  )

  assert.equal(attachedPool, pool)

  await pool.end()
})
