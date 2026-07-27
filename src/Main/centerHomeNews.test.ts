import assert from 'node:assert/strict'
import test from 'node:test'

import type { CenterSlug } from '@/lib/centers'
import { getNewsCategoriesForCenter } from '@/lib/newsCategories'

import {
  centerHomeNewsQueryPlan,
  type CenterHomeNews,
  loadCenterHomeNews,
} from './centerHomeNews'

const centers: CenterSlug[] = ['art', 'exam', 'highteen', 'kids', 'avenue']

test('every center home queries the latest published item from each news category', () => {
  for (const center of centers) {
    const categories = getNewsCategoriesForCenter(center)
    const plan = centerHomeNewsQueryPlan(center)

    assert.deepEqual(
      plan.map(({ groupKey }) => groupKey),
      categories.map(({ key }) => key),
    )

    plan.forEach(({ query }, index) => {
      assert.equal(query.limit, 1)
      assert.equal(query.sort, '-publishedAt')
      assert.deepEqual(query.where, {
        and: [
          {
            and: [
              {
                displayStatus: {
                  equals: 'published',
                },
              },
              {
                or: [
                  {
                    centers: {
                      contains: center,
                    },
                  },
                  {
                    centers: {
                      contains: 'all',
                    },
                  },
                ],
              },
            ],
          },
          {
            category: {
              equals: categories[index]?.value,
            },
          },
        ],
      })
    })
  }
})

test('center home news keeps successful groups when another group is empty or fails', async () => {
  const successfulNews = news(1, '카테고리 최신 글')
  let queryIndex = 0

  const result = await loadCenterHomeNews('art', async (query) => {
    queryIndex += 1

    if (queryIndex === 1) {
      return { docs: [successfulNews, news(2, '노출되면 안 되는 두 번째 글')] }
    }

    if (queryIndex === 2) {
      throw new Error('group query failed')
    }

    assert.equal(query.limit, 1)
    return { docs: [] }
  })

  assert.deepEqual(result, [successfulNews])
})

function news(id: number, title: string): CenterHomeNews {
  return {
    category: '교육ㆍ운영ㆍ소식',
    id,
    publishedAt: '2026-07-27T00:00:00.000Z',
    slug: String(id),
    title,
  }
}
