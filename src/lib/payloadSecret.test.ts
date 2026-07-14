import assert from 'node:assert/strict'
import test from 'node:test'

import { resolvePayloadSecret } from './payloadSecret'

test('설정된 PAYLOAD_SECRET을 공백 정리 후 사용한다', () => {
  assert.equal(
    resolvePayloadSecret({
      NODE_ENV: 'production',
      PAYLOAD_SECRET: '  configured-secret  ',
    }),
    'configured-secret',
  )
})

test('운영 환경에서 PAYLOAD_SECRET이 없으면 시작을 중단한다', () => {
  assert.throws(
    () => resolvePayloadSecret({ NODE_ENV: 'production' }),
    /PAYLOAD_SECRET 환경변수가 필요합니다/,
  )
})

test('Vercel 미리보기 환경에서도 PAYLOAD_SECRET이 없으면 시작을 중단한다', () => {
  assert.throws(
    () => resolvePayloadSecret({ NODE_ENV: 'development', VERCEL_ENV: 'preview' }),
    /PAYLOAD_SECRET 환경변수가 필요합니다/,
  )
})

test('로컬 개발 환경에서는 제한된 개발용 fallback을 사용한다', () => {
  const secret = resolvePayloadSecret({ NODE_ENV: 'development' })

  assert.equal(typeof secret, 'string')
  assert.ok(secret.length > 0)
})
