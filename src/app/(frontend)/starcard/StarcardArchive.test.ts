import assert from 'node:assert/strict'
import test from 'node:test'

import type { Payload } from 'payload'

import { findStarcards } from './StarcardArchive'

test('스타카드 조회는 정상적인 빈 결과를 그대로 반환한다', async () => {
  const payload = {
    find: async () => ({ docs: [] }),
  } as unknown as Payload

  assert.deepEqual(await findStarcards({ center: 'art', payload }), [])
})

test('스타카드 조회 실패를 빈 결과로 바꾸지 않고 상위로 전달한다', async () => {
  const databaseError = new Error('database unavailable')
  const payload = {
    find: async () => {
      throw databaseError
    },
  } as unknown as Payload

  await assert.rejects(findStarcards({ center: 'art', payload }), databaseError)
})
