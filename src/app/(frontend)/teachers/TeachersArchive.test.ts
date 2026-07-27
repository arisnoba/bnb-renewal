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

  assert.deepEqual(await findTeachers({ center: 'art', payload, where }), emptyResult)
})

test('강사 조회 실패를 빈 결과로 바꾸지 않고 상위로 전달한다', async () => {
  const databaseError = new Error('database unavailable')
  const payload = {
    find: async () => {
      throw databaseError
    },
  } as unknown as Payload

  await assert.rejects(findTeachers({ center: 'art', payload, where }), databaseError)
})

test('강사 조회는 현재 센터의 정렬 필드와 ID를 사용한다', async () => {
  let sort: unknown
  const payload = {
    find: async (args: { sort?: unknown }) => {
      sort = args.sort

      return { docs: [] }
    },
  } as unknown as Payload

  await findTeachers({ center: 'kids', payload, where })

  assert.deepEqual(sort, ['kidsDisplayOrder', 'id'])
})
