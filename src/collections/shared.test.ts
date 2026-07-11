import assert from 'node:assert/strict'
import test from 'node:test'

import { isGlobalAdminUser, isMasterAdminUser } from './shared'

test('isGlobalAdminUser accepts role and permission level global admins', () => {
  assert.equal(isGlobalAdminUser({ role: 'master' }), true)
  assert.equal(isGlobalAdminUser({ role: 'admin' }), true)
  assert.equal(isGlobalAdminUser({ permissionLevel: 100, role: 'manager' }), true)
  assert.equal(isGlobalAdminUser({ permissionLevel: 80, role: 'manager' }), true)
  assert.equal(isGlobalAdminUser({ permissionLevel: 50, role: 'manager' }), false)
  assert.equal(isGlobalAdminUser({ permissionLevel: '80', role: 'manager' }), false)
  assert.equal(isGlobalAdminUser(null), false)
})

test('isMasterAdminUser accepts only master-level admins', () => {
  assert.equal(isMasterAdminUser({ role: 'master' }), true)
  assert.equal(isMasterAdminUser({ permissionLevel: 100, role: 'manager' }), true)
  assert.equal(isMasterAdminUser({ role: 'admin' }), false)
  assert.equal(isMasterAdminUser({ permissionLevel: 80, role: 'manager' }), false)
  assert.equal(isMasterAdminUser({ permissionLevel: '100', role: 'manager' }), false)
  assert.equal(isMasterAdminUser(null), false)
})
