import assert from 'node:assert/strict'
import test from 'node:test'

import type { Field } from 'payload'

import { Users } from './Users'

type NamedField = Field & {
  admin?: {
    components?: {
      Field?: unknown
    }
  }
  access?: {
    update?: (args: { req: { user?: unknown } }) => boolean | Promise<boolean>
  }
  name: string
}

function getField(fieldName: string) {
  const field = Users.fields.find(
    (item): item is NamedField => 'name' in item && item.name === fieldName,
  )

  assert.ok(field, `users.${fieldName} 필드가 있어야 합니다.`)

  return field
}

test('users admin menu is visible to logged-in center managers', () => {
  const hidden = Users.admin?.hidden

  assert.equal(typeof hidden, 'function')

  if (typeof hidden !== 'function') {
    return
  }

  assert.equal(hidden({ user: undefined } as never), true)
  assert.equal(hidden({ user: { role: 'manager', center: 'art' } } as never), false)
  assert.equal(hidden({ user: { role: 'admin', center: 'exam' } } as never), false)
})

test('users read and update access allow managers to access only their own account', async () => {
  assert.deepEqual(
    await Users.access?.read?.({ req: { user: { id: 17, role: 'manager' } } } as never),
    {
      id: {
        equals: 17,
      },
    },
  )
  assert.deepEqual(
    await Users.access?.update?.({ req: { user: { id: 17, role: 'manager' } } } as never),
    {
      id: {
        equals: 17,
      },
    },
  )
  assert.equal(await Users.access?.update?.({ req: { user: { role: 'master' } } } as never), true)
})

test('users protect role, center, and permission level from center-manager edits', async () => {
  for (const fieldName of ['role', 'center', 'permissionLevel']) {
    const field = getField(fieldName)

    assert.equal(
      await field.access?.update?.({ req: { user: { role: 'manager', center: 'kids' } } }),
      false,
    )
    assert.equal(
      await field.access?.update?.({ req: { user: { role: 'admin', center: 'kids' } } }),
      true,
    )
  }
})

test('users preserve protected fields during center-manager self updates', async () => {
  const hook = Users.hooks?.beforeValidate?.[0]

  assert.equal(typeof hook, 'function')

  if (typeof hook !== 'function') {
    return
  }

  const data = (await hook({
    collection: Users as never,
    context: {},
    data: {
      center: 'art',
      permissionLevel: 100,
      role: 'master',
    },
    operation: 'update',
    originalDoc: {
      center: 'exam',
      permissionLevel: 50,
      role: 'manager',
    },
    req: {
      user: {
        center: 'exam',
        permissionLevel: 50,
        role: 'manager',
      },
    },
  } as never)) as Record<string, unknown>

  assert.equal(data.role, 'manager')
  assert.equal(data.center, 'exam')
  assert.equal(data.permissionLevel, 50)
})

test('users form shows force unlock guidance at the bottom', () => {
  const helpField = Users.fields.at(-1)

  assert.ok(helpField)
  assert.equal(helpField.type, 'ui')
  assert.equal('name' in helpField ? helpField.name : undefined, 'forceUnlockHelp')
  assert.equal(
    helpField.admin?.components?.Field,
    '@/components/payload/ForceUnlockHelp#ForceUnlockHelp',
  )
})
