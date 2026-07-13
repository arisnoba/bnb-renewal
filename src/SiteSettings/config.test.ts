import assert from 'node:assert/strict'
import test from 'node:test'

import type { Field } from 'payload'

import { SiteSettings } from './config'
import { maintenanceDefaults } from './maintenance'

type NamedField = Field & {
  defaultValue?: unknown
  name: string
}

function getField(fieldName: string) {
  const field = SiteSettings.fields.find(
    (item): item is NamedField => 'name' in item && item.name === fieldName,
  )

  assert.ok(field, `site-settings.${fieldName} 필드가 있어야 합니다.`)

  return field
}

test('site settings admin menu is visible only to master-level admins', () => {
  const hidden = SiteSettings.admin?.hidden

  assert.equal(typeof hidden, 'function')

  if (typeof hidden !== 'function') {
    return
  }

  assert.equal(hidden({ user: undefined } as never), true)
  assert.equal(hidden({ user: { role: 'manager', center: 'art' } } as never), true)
  assert.equal(hidden({ user: { role: 'admin', center: 'exam' } } as never), true)
  assert.equal(hidden({ user: { permissionLevel: 100, role: 'manager' } } as never), false)
  assert.equal(hidden({ user: { role: 'master' } } as never), false)
})

test('site settings can be updated only by master-level admins', async () => {
  assert.equal(await SiteSettings.access?.read?.({ req: { user: undefined } } as never), true)
  assert.equal(
    await SiteSettings.access?.update?.({ req: { user: { role: 'admin' } } } as never),
    false,
  )
  assert.equal(
    await SiteSettings.access?.update?.({ req: { user: { permissionLevel: 80 } } } as never),
    false,
  )
  assert.equal(
    await SiteSettings.access?.update?.({ req: { user: { permissionLevel: 100 } } } as never),
    true,
  )
  assert.equal(await SiteSettings.access?.update?.({ req: { user: { role: 'master' } } } as never), true)
})

test('site settings provide maintenance page defaults', () => {
  assert.equal(getField('maintenanceMode').defaultValue, false)
  assert.equal(getField('maintenanceTitle').defaultValue, maintenanceDefaults.title)
  assert.equal(getField('maintenanceMessage').defaultValue, maintenanceDefaults.message)
})
