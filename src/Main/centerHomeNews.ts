import type { Where } from 'payload'

import type { CenterSlug } from '@/lib/centers'
import { getNewsCategoriesForCenter } from '@/lib/newsCategories'
import type { News } from '@/payload-types'

export type CenterHomeNews = Pick<
  News,
  'id' | 'category' | 'publishedAt' | 'slug' | 'title'
>

type CenterHomeNewsQuery = {
  limit: number
  sort: '-publishedAt'
  where: Where
}

type CenterHomeNewsQueryPlan = {
  groupKey: string
  query: CenterHomeNewsQuery
}[]

const newsGroupLimit = 1

export function centerHomeNewsQueryPlan(center: CenterSlug): CenterHomeNewsQueryPlan {
  const publishedForCenter = publishedNewsWhere(center)

  return getNewsCategoriesForCenter(center).map((category) => ({
    groupKey: category.key,
    query: {
      limit: newsGroupLimit,
      sort: '-publishedAt',
      where: {
        and: [
          publishedForCenter,
          {
            category: {
              equals: category.value,
            },
          },
        ],
      },
    },
  }))
}

export async function loadCenterHomeNews(
  center: CenterSlug,
  find: (query: CenterHomeNewsQuery) => Promise<{ docs: CenterHomeNews[] }>,
): Promise<CenterHomeNews[]> {
  const plan = centerHomeNewsQueryPlan(center)
  const results = await Promise.allSettled(plan.map(({ query }) => find(query)))

  return results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value.docs.slice(0, newsGroupLimit) : [],
  )
}

function publishedNewsWhere(center: CenterSlug): Where {
  return {
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
  }
}
