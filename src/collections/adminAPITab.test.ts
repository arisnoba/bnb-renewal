import assert from 'node:assert/strict'
import test from 'node:test'

import type { CollectionConfig, GlobalConfig } from 'payload'

import { MainStatistics } from '../Main/Statistics'
import {
  applyGlobalMasterAdminAPITab,
  applyMasterAdminAPITab,
  canViewAdminAPITab,
} from './adminAPITab'

test('admin API tabs are visible only to master-level admins', () => {
  assert.equal(canViewAdminAPITab({ req: { user: { role: 'master' } } } as never), true)
  assert.equal(
    canViewAdminAPITab({
      req: { user: { permissionLevel: 100, role: 'manager' } },
    } as never),
    true,
  )
  assert.equal(canViewAdminAPITab({ req: { user: { role: 'admin' } } } as never), false)
  assert.equal(
    canViewAdminAPITab({
      req: { user: { permissionLevel: 80, role: 'manager' } },
    } as never),
    false,
  )
})

test('applyMasterAdminAPITab adds the shared condition to every collection', () => {
  const collections = applyMasterAdminAPITab([
    {
      slug: 'first',
      fields: [],
    },
    {
      slug: 'second',
      admin: {
        components: {
          views: {
            edit: {
              api: {
                tab: {
                  href: '/custom-api',
                },
              },
            },
          },
        },
      },
      fields: [],
    },
  ] satisfies CollectionConfig[])

  for (const collection of collections) {
    assert.equal(
      collection.admin?.components?.views?.edit?.api?.tab?.condition,
      canViewAdminAPITab,
    )
  }
  assert.equal(
    collections[1]?.admin?.components?.views?.edit?.api?.tab?.href,
    '/custom-api',
  )
})

test('applyGlobalMasterAdminAPITab covers main statistics and preserves global admin config', () => {
  const [mainStatistics] = applyGlobalMasterAdminAPITab([MainStatistics] satisfies GlobalConfig[])

  assert.equal(mainStatistics?.slug, 'main-statistics')
  assert.equal(mainStatistics?.admin?.group, '메인설정')
  assert.equal(
    mainStatistics?.admin?.components?.views?.edit?.api?.tab?.condition,
    canViewAdminAPITab,
  )
})
