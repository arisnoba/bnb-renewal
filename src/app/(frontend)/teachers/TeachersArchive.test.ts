import assert from 'node:assert/strict'
import test from 'node:test'

import type { Payload, Where } from 'payload'

import { findTeachers } from './TeachersArchive'

const where = {} satisfies Where

test('강사 조회는 정상적인 빈 결과를 그대로 반환한다', async () => {
  const emptyResult = { docs: [] }
  const payload = {
    find: async () => emptyResult,
  } as unknown as Payload

  assert.deepEqual(await findTeachers({ payload, where }), emptyResult)
})

test('강사 조회 실패를 빈 결과로 바꾸지 않고 상위로 전달한다', async () => {
  const databaseError = new Error('database unavailable')
  const payload = {
    find: async () => {
      throw databaseError
    },
  } as unknown as Payload

  await assert.rejects(findTeachers({ payload, where }), databaseError)
})
