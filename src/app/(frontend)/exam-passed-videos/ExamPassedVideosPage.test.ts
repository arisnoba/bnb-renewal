import assert from 'node:assert/strict'
import test from 'node:test'

import type { Payload } from 'payload'

import { findExamPassedVideosPage } from './ExamPassedVideosPage'

test('합격영상 조회는 정상적인 빈 페이지를 그대로 반환한다', async () => {
  const payload = {
    find: async () => ({
      docs: [],
      page: 1,
      totalDocs: 0,
      totalPages: 0,
    }),
  } as unknown as Payload

  assert.deepEqual(await findExamPassedVideosPage({ page: 1, payload }), {
    docs: [],
    page: 1,
    totalDocs: 0,
    totalPages: 0,
  })
})

test('합격영상 조회 실패를 빈 페이지로 바꾸지 않고 상위로 전달한다', async () => {
  const databaseError = new Error('database unavailable')
  const payload = {
    find: async () => {
      throw databaseError
    },
  } as unknown as Payload

  await assert.rejects(findExamPassedVideosPage({ page: 1, payload }), databaseError)
})
