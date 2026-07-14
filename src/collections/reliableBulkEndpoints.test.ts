import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, Endpoint, PayloadRequest } from 'payload'

import { applyReliableBulkEndpoints } from './reliableBulkEndpoints'

test('일괄 수정은 숨김 필드 요청을 무시하고 사용자 접근 권한으로 응답 문서를 조회한다', async () => {
  let findByIDOptions: Record<string, unknown> | undefined
  let updateOptions: Record<string, unknown> | undefined
  const payload = {
    config: {},
    find: async () => ({ docs: [{ id: 1 }] }),
    findByID: async (options: Record<string, unknown>) => {
      findByIDOptions = options

      if (options.overrideAccess === false && !('showHiddenFields' in options)) {
        return { email: 'updated@example.com', id: 1 }
      }

      return {
        email: 'updated@example.com',
        hash: 'should-not-be-returned',
        id: 1,
        salt: 'should-not-be-returned',
      }
    },
    update: async (options: Record<string, unknown>) => {
      updateOptions = options
      return { id: 1 }
    },
  }
  const request = new Request('http://localhost/api/users?showHiddenFields=true', {
    body: JSON.stringify({ email: 'updated@example.com' }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  }) as PayloadRequest

  Object.assign(request, {
    payload,
    query: {
      showHiddenFields: 'true',
      where: {
        id: {
          equals: 1,
        },
      },
    },
  })

  const [users] = applyReliableBulkEndpoints([
    {
      slug: 'users',
    } as CollectionConfig,
  ])
  const updateEndpoint = (users.endpoints as Endpoint[]).find(
    (endpoint) => endpoint.method === 'patch' && endpoint.path === '/',
  )

  assert.ok(updateEndpoint)

  const response = await updateEndpoint.handler(request)
  const result = (await response.json()) as { docs: Array<Record<string, unknown>> }

  assert.equal(response.status, 200)
  assert.equal(updateOptions?.overrideAccess, false)
  assert.equal('showHiddenFields' in (updateOptions ?? {}), false)
  assert.equal(findByIDOptions?.overrideAccess, false)
  assert.equal('showHiddenFields' in (findByIDOptions ?? {}), false)
  assert.deepEqual(result.docs, [{ email: 'updated@example.com', id: 1 }])
  assert.equal('hash' in result.docs[0], false)
  assert.equal('salt' in result.docs[0], false)
})
