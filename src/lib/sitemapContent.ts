import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { selectedFrontendCenters } from '@/collections/revalidateFrontend'
import type { ArtistPress, News, Teacher } from '@/payload-types'

import { centerFromHostname, centerOrigin } from './centerDomains'
import type { CenterSlug } from './centers'
import type { SitemapEntry } from './crawlerFiles'

type SitemapContentDocument = Pick<
  ArtistPress | News | Teacher,
  'centers' | 'id' | 'slug' | 'updatedAt'
> & {
  publishedAt?: string | null
}

export async function queryPublishedSitemapEntries(origin: string): Promise<SitemapEntry[]> {
  const center = centerFromHostname(new URL(origin).hostname)

  if (!center) {
    return []
  }

  const payload = await getPayload({ config: configPromise })
  const centerWhere = {
    or: [{ centers: { contains: center } }, { centers: { contains: 'all' } }],
  }
  const [news, teachers, artistPress] = await Promise.all([
    payload.find({
      collection: 'news',
      depth: 0,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { centers: true, publishedAt: true, slug: true, updatedAt: true },
      where: { and: [{ displayStatus: { equals: 'published' } }, centerWhere] },
    }),
    payload.find({
      collection: 'teachers',
      depth: 0,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { centers: true, slug: true, updatedAt: true },
      where: { and: [{ status: { equals: 'published' } }, centerWhere] },
    }),
    payload.find({
      collection: 'artist-press',
      depth: 0,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { centers: true, publishedAt: true, slug: true, updatedAt: true },
      where: { and: [{ displayStatus: { equals: 'published' } }, centerWhere] },
    }),
  ])

  return buildPublishedSitemapEntries({
    artistPress: artistPress.docs as SitemapContentDocument[],
    center,
    news: news.docs as SitemapContentDocument[],
    teachers: teachers.docs as SitemapContentDocument[],
  })
}

export function buildPublishedSitemapEntries({
  artistPress,
  center,
  news,
  teachers,
}: {
  artistPress: SitemapContentDocument[]
  center: CenterSlug
  news: SitemapContentDocument[]
  teachers: SitemapContentDocument[]
}) {
  const origin = centerOrigin(center)
  const centerHasArtistPress = center === 'art' || center === 'avenue'
  const entries = [
    ...contentEntries(news, center, origin, 'news', (document) => String(document.id)),
    ...contentEntries(teachers, center, origin, 'teachers', (document) => document.slug),
    ...(centerHasArtistPress
      ? contentEntries(artistPress, center, origin, 'artist-press', (document) =>
          String(document.id)
        )
      : []),
  ]

  return [...new Map(entries.map((entry) => [entry.url, entry])).values()]
}

function contentEntries(
  documents: SitemapContentDocument[],
  center: CenterSlug,
  origin: string,
  path: string,
  identifier: (document: SitemapContentDocument) => string
) {
  return documents.flatMap((document): SitemapEntry[] => {
    if (!selectedFrontendCenters(document.centers).includes(center)) {
      return []
    }

    const value = identifier(document).trim()

    if (!value) {
      return []
    }

    return [
      {
        lastModified: document.updatedAt || document.publishedAt,
        url: `${origin}/${path}/${encodeURIComponent(value)}`,
      },
    ]
  })
}
