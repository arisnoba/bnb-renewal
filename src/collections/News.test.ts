import assert from 'node:assert/strict'
import test from 'node:test'

import { News, canViewNewsAPITab, setNewsSlugBeforeValidate } from './News'

async function runNewsSlugHook({
  data,
  operation = 'create',
  originalDoc,
  context = {},
}: {
  data: Record<string, unknown>
  operation?: 'create' | 'update'
  originalDoc?: Record<string, unknown>
  context?: Record<string, unknown>
}) {
  return (await setNewsSlugBeforeValidate({
    collection: {} as never,
    context,
    data,
    operation,
    originalDoc,
    req: {
      context,
      payload: {},
    },
  } as never)) as Record<string, unknown>
}

test('news beforeValidate hook uses pending create slugs without querying existing slugs', async () => {
  const data = await runNewsSlugHook({
    data: {
      centers: ['highteen'],
      slug: '신규-소식-제목',
      title: '신규 소식 제목',
    },
  })

  assert.match(String(data.slug), /^pending-[0-9a-f-]{36}$/)
})

test('news API admin tab is visible only to master-level admins', () => {
  const condition = News.admin?.components?.views?.edit?.api?.tab?.condition

  assert.equal(condition, canViewNewsAPITab)
  assert.equal(canViewNewsAPITab({ req: { user: { role: 'master' } } }), true)
  assert.equal(
    canViewNewsAPITab({ req: { user: { permissionLevel: 100, role: 'manager' } } }),
    true,
  )
  assert.equal(canViewNewsAPITab({ req: { user: { role: 'admin' } } }), false)
  assert.equal(
    canViewNewsAPITab({ req: { user: { permissionLevel: 80, role: 'manager' } } }),
    false,
  )
})

test('news beforeValidate hook ignores manually supplied create slugs', async () => {
  const data = await runNewsSlugHook({
    data: {
      centers: ['kids'],
      generateSlug: false,
      slug: '배우-박새봄-sbs-드라마-신이랑-법률사무소-onair',
      title: '배우 박새봄 SBS 드라마 신이랑 법률사무소 ONAIR',
    },
  })

  assert.equal('generateSlug' in data, false)
  assert.match(String(data.slug), /^pending-[0-9a-f-]{36}$/)
})

test('news beforeValidate hook keeps existing update slugs stable', async () => {
  const data = await runNewsSlugHook({
    data: {
      centers: ['exam'],
      slug: '변경된-제목',
      title: '변경된 제목',
    },
    operation: 'update',
    originalDoc: {
      id: 7,
      slug: '7',
    },
  })

  assert.equal('generateSlug' in data, false)
  assert.equal(data.slug, '7')
})

test('news beforeValidate hook ignores manually supplied update slugs', async () => {
  const data = await runNewsSlugHook({
    data: {
      centers: ['kids'],
      generateSlug: false,
      slug: '변경된-제목',
      title: '변경된 제목',
    },
    operation: 'update',
    originalDoc: {
      id: 12,
      generateSlug: false,
      slug: '12',
    },
  })

  assert.equal('generateSlug' in data, false)
  assert.equal(data.slug, '12')
})

test('news beforeValidate hook keeps update slugs based on document id', async () => {
  const data = await runNewsSlugHook({
    data: {
      centers: ['exam'],
      slug: '수동-변경',
      title: '센터 변경',
    },
    operation: 'update',
    originalDoc: {
      id: 12,
      slug: '12',
    },
  })

  assert.equal(data.slug, '12')
})

test('news beforeValidate hook allows final id slug during create finalization', async () => {
  const data = await runNewsSlugHook({
    context: {
      finalizeIdSlug: true,
    },
    data: {
      centers: ['art'],
      generateSlug: false,
      slug: '6257',
    },
    operation: 'update',
    originalDoc: {
      id: 6257,
      slug: 'pending-2f09bdba-3b47-4a45-8b82-79f14ef5c111',
    },
  })

  assert.equal('generateSlug' in data, false)
  assert.equal(data.slug, '6257')
})
