import assert from 'node:assert/strict'
import test from 'node:test'

import { ScreenAppearances } from './ScreenAppearances'

async function runAccess(
  action: 'create' | 'read' | 'update' | 'delete',
  user: unknown,
) {
  const access = ScreenAppearances.access?.[action]

  assert.ok(access, `screen-appearances ${action} access가 있어야 합니다.`)

  return access({
    req: {
      user,
    },
  } as never)
}

test('screen appearances keep public read access for frontend rendering', async () => {
  assert.equal(await runAccess('read', undefined), true)
})

test('screen appearances use single-center equality access for art managers', async () => {
  const user = {
    center: 'art',
    permissionLevel: 50,
    role: 'manager',
  }

  assert.deepEqual(await runAccess('read', user), {
    centers: {
      equals: 'art',
    },
  })
  assert.deepEqual(await runAccess('update', user), {
    centers: {
      equals: 'art',
    },
  })
  assert.equal(await runAccess('create', user), true)
})

test('screen appearances allow global admins without a center filter', async () => {
  const user = {
    center: 'exam',
    permissionLevel: 80,
    role: 'admin',
  }

  assert.equal(await runAccess('read', user), true)
  assert.equal(await runAccess('update', user), true)
  assert.equal(await runAccess('create', user), true)
})
