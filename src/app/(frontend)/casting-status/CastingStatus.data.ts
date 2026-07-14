import type { CenterSlug } from '@/lib/centers'
import type { CastingAppearance } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { publishedImageSrc } from '@/utilities/publishedImageSrc'
import type { Payload, Where } from 'payload'

import type { CastingStatusPosterItem, CastingStatusYearGroup } from './CastingStatusYearSwiper.client'

export const castingStatusCenters: readonly CenterSlug[] = ['art', 'avenue', 'highteen', 'kids']

export const CASTING_STATUS_INITIAL_YEAR_COUNT = 4
export const CASTING_STATUS_YEAR_BATCH_SIZE = 2
export const CASTING_STATUS_YEAR_PAGE_SIZE = 12
const CASTING_STATUS_YEAR_SUMMARY_LIMIT = 500

type CastingStatusListItem = Pick<
  CastingAppearance,
  | 'castMembers'
  | 'castingCompany'
  | 'createdAt'
  | 'id'
  | 'publishedAt'
  | 'slug'
  | 'thumbnailPath'
  | 'title'
>

const castingStatusSelect = {
  castMembers: true,
  castingCompany: true,
  createdAt: true,
  publishedAt: true,
  slug: true,
  thumbnailPath: true,
  title: true,
} as const

type CastingStatusYearSummaryItem = Pick<CastingAppearance, 'createdAt' | 'id' | 'publishedAt'>

export type CastingStatusOverviewData = {
  groups: CastingStatusYearGroup[]
  hasNextYearPage: boolean
  items: CastingStatusPosterItem[]
  nextYearOffset: number | null
}

export type CastingStatusYearBatch = {
  groups: CastingStatusYearGroup[]
  hasNextYearPage: boolean
  nextYearOffset: number | null
}

export async function findCastingStatusOverview({
  center,
  payload,
}: {
  center: CenterSlug
  payload: Payload
}): Promise<CastingStatusOverviewData> {
  const yearBatch = await findCastingStatusYearBatch({
    center,
    limit: CASTING_STATUS_INITIAL_YEAR_COUNT,
    offset: 0,
    payload,
  })

  return {
    ...yearBatch,
    items: yearBatch.groups.flatMap((group) => group.items),
  }
}

export async function findCastingStatusYearBatch({
  center,
  limit = CASTING_STATUS_YEAR_BATCH_SIZE,
  offset = 0,
  payload,
}: {
  center: CenterSlug
  limit?: number
  offset?: number
  payload: Payload
}): Promise<CastingStatusYearBatch> {
  const years = await findCastingStatusYears({ center, payload })
  const visibleYears = years.slice(offset, offset + limit)
  const groups = await Promise.all(
    visibleYears.map((year) =>
      findCastingStatusYearPage({
        center,
        limit: CASTING_STATUS_YEAR_PAGE_SIZE,
        page: 1,
        payload,
        year,
      }),
    ),
  )
  const nextYearOffset = offset + visibleYears.length
  const hasNextYearPage = nextYearOffset < years.length

  return {
    groups,
    hasNextYearPage,
    nextYearOffset: hasNextYearPage ? nextYearOffset : null,
  }
}

export async function findCastingStatusYearPage({
  center,
  limit = CASTING_STATUS_YEAR_PAGE_SIZE,
  page = 1,
  payload,
  year,
}: {
  center: CenterSlug
  limit?: number
  page?: number
  payload: Payload
  year: string
}): Promise<CastingStatusYearGroup> {
  const result = await payload.find({
    collection: 'casting-appearances',
    depth: 0,
    limit,
    overrideAccess: false,
    page,
    select: castingStatusSelect,
    sort: '-publishedAt',
    where: createCastingStatusWhere(center, year),
  })
  const items = (result.docs as CastingStatusListItem[]).map(toCastingStatusPosterItem)

  return {
    hasNextPage: Boolean(result.hasNextPage),
    items,
    nextPage: typeof result.nextPage === 'number' ? result.nextPage : null,
    year,
  }
}

async function findCastingStatusYears({
  center,
  payload,
}: {
  center: CenterSlug
  payload: Payload
}) {
  const result = await payload.find({
    collection: 'casting-appearances',
    depth: 0,
    limit: CASTING_STATUS_YEAR_SUMMARY_LIMIT,
    overrideAccess: false,
    pagination: false,
    select: {
      createdAt: true,
      publishedAt: true,
    },
    sort: '-publishedAt',
    where: createCastingStatusWhere(center),
  })
  const years: string[] = []
  const seenYears = new Set<string>()

  for (const item of result.docs as CastingStatusYearSummaryItem[]) {
    const year = getYearLabel(item.publishedAt ?? item.createdAt)

    if (!seenYears.has(year)) {
      seenYears.add(year)
      years.push(year)
    }
  }

  return years
}

function createCastingStatusWhere(center: CenterSlug, year?: string): Where {
  const and: NonNullable<Where['and']> = [
    {
      displayStatus: {
        equals: 'published',
      },
    },
    {
      or: [
        {
          centers: {
            equals: center,
          },
        },
        {
          centers: {
            equals: 'all',
          },
        },
      ],
    },
  ]

  if (year) {
    and.push({
      publishedAt: {
        greater_than_equal: `${year}-01-01T00:00:00.000Z`,
        less_than: `${Number(year) + 1}-01-01T00:00:00.000Z`,
      },
    })
  }

  return {
    and,
  }
}

function toCastingStatusPosterItem(item: CastingStatusListItem): CastingStatusPosterItem {
  const castMembers =
    item.castMembers
      ?.map((member) => ({
        actorName: normalizeText(member.actorName),
        episodeNumbers: normalizeText(member.episodeNumbers),
        roleName: normalizeText(member.roleName),
      }))
      .filter((member) => member.actorName || member.roleName || member.episodeNumbers) ?? []

  return {
    castMembers,
    castingCompany: normalizeText(item.castingCompany) || '유캐스팅',
    date: item.publishedAt ?? item.createdAt,
    id: item.id,
    imageUrl: normalizeImageUrl(item.thumbnailPath),
    slug: String(item.id),
    title: normalizeText(item.title) || '캐스팅 출연현황',
  }
}

function getYearLabel(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '연도 미정'
  }

  return String(date.getFullYear())
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function normalizeImageUrl(value: string | null | undefined) {
  const trimmed = publishedImageSrc(value)

  if (!trimmed) {
    return ''
  }

  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/')) {
    return getMediaUrl(trimmed)
  }

  return getMediaUrl(`/${trimmed.replace(/^\/+/, '')}`)
}
