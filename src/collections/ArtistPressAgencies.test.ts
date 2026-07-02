import assert from 'node:assert/strict'
import test from 'node:test'

import { ArtistPressAgencies } from './ArtistPressAgencies'

async function runAccess(user: unknown) {
  const access = ArtistPressAgencies.access?.read

  assert.ok(access, '소속사 로고 설정 read access가 있어야 합니다.')

  return access({
    req: {
      user,
    },
  } as never)
}

test('artist press agency settings keep public read access for frontend rendering', async () => {
  assert.equal(await runAccess(undefined), true)
})

test('artist press agency settings are readable by art managers without a center row filter', async () => {
  const result = await runAccess({
    center: 'art',
    permissionLevel: 50,
    role: 'manager',
  })

  assert.equal(result, true)
})
