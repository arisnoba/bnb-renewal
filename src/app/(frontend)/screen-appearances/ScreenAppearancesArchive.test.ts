import assert from 'node:assert/strict'
import test from 'node:test'

import type { Payload, Where } from 'payload'

import { findHeroImages, findScreenAppearancesPage } from './ScreenAppearancesArchive'

const where = {} satisfies Where

test('출연장면 목록 조회는 정상적인 빈 페이지를 그대로 반환한다', async () => {
  const payload = {
    find: async () => ({
      docs: [],
      page: 1,
      totalDocs: 0,
      totalPages: 0,
    }),
  } as unknown as Payload

  assert.deepEqual(await findScreenAppearancesPage({ page: 1, payload, where }), {
    docs: [],
    page: 1,
    totalDocs: 0,
    totalPages: 0,
  })
})

test('출연장면 목록 조회 실패를 빈 페이지로 바꾸지 않고 상위로 전달한다', async () => {
  const databaseError = new Error('database unavailable')
  const payload = {
    find: async () => {
      throw databaseError
    },
  } as unknown as Payload

  await assert.rejects(
    findScreenAppearancesPage({ page: 1, payload, where }),
    databaseError,
  )
})

test('출연장면 히어로 이미지 조회는 정상적인 빈 결과를 그대로 반환한다', async () => {
  const payload = {
    find: async () => ({ docs: [] }),
  } as unknown as Payload

  assert.deepEqual(await findHeroImages({ payload, where }), [])
})

test('출연장면 히어로 이미지 조회 실패를 빈 결과로 바꾸지 않고 상위로 전달한다', async () => {
  const databaseError = new Error('database unavailable')
  const payload = {
    find: async () => {
      throw databaseError
    },
  } as unknown as Payload

  await assert.rejects(findHeroImages({ payload, where }), databaseError)
})
