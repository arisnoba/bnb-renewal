import assert from 'node:assert/strict'
import test from 'node:test'

import type { Faq } from '@/payload-types'
import type { Payload } from 'payload'

import { findFaqs } from './FaqArchive'

const faq = {
  id: 1,
  title: '자주 묻는 질문',
} as Faq

test('FAQ 조회는 정상적인 빈 결과를 그대로 반환한다', async () => {
  const payload = {
    find: async () => ({ docs: [] }),
  } as unknown as Payload

  assert.deepEqual(await findFaqs({ center: 'art', payload }), [])
})

test('FAQ 조회 실패를 빈 결과로 바꾸지 않고 상위로 전달한다', async () => {
  const databaseError = new Error('database unavailable')
  const payload = {
    find: async () => {
      throw databaseError
    },
  } as unknown as Payload

  await assert.rejects(findFaqs({ center: 'art', payload }), databaseError)
})

test('FAQ 조회 결과의 문서 목록을 반환한다', async () => {
  const payload = {
    find: async () => ({ docs: [faq] }),
  } as unknown as Payload

  assert.deepEqual(await findFaqs({ center: 'art', payload }), [faq])
})
