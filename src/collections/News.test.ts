import assert from 'node:assert/strict'
import test from 'node:test'

import {
  pinnedNewsConflictWhere,
  setNewsSlugBeforeValidate,
  validatePinnedNewsPerCenter,
} from './News'

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

test('pinned news conflict query treats all-center news as occupying every center', () => {
  assert.deepEqual(
    pinnedNewsConflictWhere({
      centers: ['art'],
      currentId: 17,
    }),
    {
      and: [
        {
          isPinned: {
            equals: true,
          },
        },
        {
          or: [
            {
              centers: {
                contains: 'all',
              },
            },
            {
              centers: {
                contains: 'art',
              },
            },
          ],
        },
        {
          id: {
            not_equals: 17,
          },
        },
      ],
    },
  )

  const allCentersWhere = pinnedNewsConflictWhere({ centers: ['all'] })

  assert.ok(allCentersWhere && 'and' in allCentersWhere)
  assert.deepEqual(allCentersWhere.and?.[1], {
    or: [
      { centers: { contains: 'all' } },
      { centers: { contains: 'art' } },
      { centers: { contains: 'exam' } },
      { centers: { contains: 'kids' } },
      { centers: { contains: 'highteen' } },
      { centers: { contains: 'avenue' } },
    ],
  })
})

test('pinned news validation blocks a second pin for an overlapping center', async () => {
  let receivedQuery: Record<string, unknown> | undefined
  const result = await validatePinnedNewsPerCenter(true, {
    id: 25,
    req: {
      payload: {
        find: async (query: Record<string, unknown>) => {
          receivedQuery = query
          return { docs: [{ id: 12 }] }
        },
      },
    },
    siblingData: {
      centers: ['kids'],
    },
  } as never)

  assert.equal(
    result,
    '선택한 센터에는 이미 고정된 뉴스가 있습니다. 기존 고정을 먼저 해제해 주세요.',
  )
  assert.deepEqual(receivedQuery?.where, pinnedNewsConflictWhere({ centers: ['kids'], currentId: 25 }))
})

test('pinned news validation permits an available center and skips unchecked news', async () => {
  let calls = 0
  const options = {
    req: {
      payload: {
        find: async () => {
          calls += 1
          return { docs: [] }
        },
      },
    },
    siblingData: {
      centers: ['exam'],
    },
  } as never

  assert.equal(await validatePinnedNewsPerCenter(true, options), true)
  assert.equal(await validatePinnedNewsPerCenter(false, options), true)
  assert.equal(calls, 1)
})
