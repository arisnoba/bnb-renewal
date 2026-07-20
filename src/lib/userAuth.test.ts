import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveUserAuth } from './userAuth'

test('Vercel 운영 환경에서는 인증 쿠키를 모든 센터 서브도메인과 공유한다', () => {
  assert.deepEqual(resolveUserAuth({ VERCEL_ENV: 'production' }), {
    cookies: {
      domain: 'baewooenm.com',
      sameSite: 'Lax',
      secure: true,
    },
  })
})

test('Vercel 미리보기 환경에서는 호스트 전용 인증 쿠키를 유지한다', () => {
  assert.equal(resolveUserAuth({ VERCEL_ENV: 'preview' }), true)
})

test('로컬 환경에서는 호스트 전용 인증 쿠키를 유지한다', () => {
  assert.equal(resolveUserAuth({ NODE_ENV: 'development' }), true)
})
