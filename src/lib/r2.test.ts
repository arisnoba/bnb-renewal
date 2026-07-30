import assert from 'node:assert/strict'
import test from 'node:test'

import { toR2UploadBuffer } from './r2'

test('R2 upload body copies a SharedArrayBuffer-backed view into a regular Buffer', () => {
  const sharedBuffer = new SharedArrayBuffer(6)
  const body = new Uint8Array(sharedBuffer, 1, 4)
  body.set([10, 20, 30, 40])

  const uploadBuffer = toR2UploadBuffer(body)

  assert.equal(Buffer.isBuffer(uploadBuffer), true)
  assert.equal(uploadBuffer.buffer instanceof SharedArrayBuffer, false)
  assert.deepEqual([...uploadBuffer], [10, 20, 30, 40])
})

test('R2 upload body copies an existing Buffer', () => {
  const body = Buffer.from([1, 2, 3])
  const uploadBuffer = toR2UploadBuffer(body)

  assert.notEqual(uploadBuffer, body)
  assert.deepEqual(uploadBuffer, body)
})
