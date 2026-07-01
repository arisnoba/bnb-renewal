import assert from 'node:assert/strict'
import test from 'node:test'

import {
  newsSlugPrefixFromCenters,
  nextNewsSlugForCenters,
  setNewsSlugBeforeValidate,
} from './News'

type FindArgs = {
  limit: number
  page: number
  where: {
    slug: {
      like: string
    }
  }
}

function payloadWithSlugs(slugs: string[]) {
  const calls: FindArgs[] = []

  return {
    calls,
    payload: {
      async find(args: FindArgs) {
        calls.push(args)

        const matchingSlugs = slugs
          .filter((slug) => slug.includes(args.where.slug.like))
          .map((slug, index) => ({ id: index + 1, slug }))

        const start = (args.page - 1) * args.limit
        const end = start + args.limit

        return {
          docs: matchingSlugs.slice(start, end),
          nextPage: end < matchingSlugs.length ? args.page + 1 : null,
        }
      },
    },
  }
}

async function runNewsSlugHook({
  data,
  operation = 'create',
  originalDoc,
  payload,
}: {
  data: Record<string, unknown>
  operation?: 'create' | 'update'
  originalDoc?: Record<string, unknown>
  payload: unknown
}) {
  return (await setNewsSlugBeforeValidate({
    collection: {} as never,
    context: {},
    data,
    operation,
    originalDoc,
    req: {
      payload,
    },
  } as never)) as Record<string, unknown>
}

test('news slug prefix uses selected center', () => {
  assert.equal(newsSlugPrefixFromCenters(['highteen']), 'news-highteen')
  assert.equal(newsSlugPrefixFromCenters(['all']), 'news-all')
  assert.equal(newsSlugPrefixFromCenters(['unknown', 'exam']), 'news-exam')
  assert.equal(newsSlugPrefixFromCenters([]), 'news-art')
})

test('news slug generation uses the next numeric suffix for the center', async () => {
  const { calls, payload } = payloadWithSlugs([
    ...Array.from({ length: 105 }, (_, index) => `news-art-${index + 1}`),
    'news-art-title-slug',
    'old-news-art-999',
    'news-exam-500',
  ])

  const slug = await nextNewsSlugForCenters({
    centers: ['art'],
    payload: payload as never,
  })

  assert.equal(slug, 'news-art-106')
  assert.equal(calls.length, 2)
})

test('news beforeValidate hook replaces title-based create slugs', async () => {
  const { payload } = payloadWithSlugs(['news-highteen-1', 'news-highteen-2'])

  const data = await runNewsSlugHook({
    data: {
      centers: ['highteen'],
      slug: '신규-소식-제목',
      title: '신규 소식 제목',
    },
    payload,
  })

  assert.equal(data.slug, 'news-highteen-3')
})

test('news beforeValidate hook keeps existing update slugs stable', async () => {
  const { payload } = payloadWithSlugs(['news-exam-7', 'news-exam-8'])

  const data = await runNewsSlugHook({
    data: {
      centers: ['exam'],
      slug: '변경된-제목',
      title: '변경된 제목',
    },
    operation: 'update',
    originalDoc: {
      id: 7,
      slug: 'news-exam-7',
    },
    payload,
  })

  assert.equal(data.slug, 'news-exam-7')
})
