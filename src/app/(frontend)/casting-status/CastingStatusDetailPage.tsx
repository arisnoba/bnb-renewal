import type { Metadata } from 'next'

import { centers, getCenterLabel, type CenterSlug } from '@/lib/centers'
import type { CastingAppearance } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import {
  DetailBackLink,
  DetailContainer,
  DetailPage,
  DetailPager,
} from '../_components/DetailLayout'

export async function generateCastingStatusStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'casting-appearances',
      depth: 0,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        centers: true,
        slug: true,
      },
      where: {
        displayStatus: {
          equals: 'published',
        },
      },
    })

    return result.docs.flatMap((appearance) => {
      const slug = appearance.slug
      const centerSlugs = getStaticParamCenters(appearance.centers)

      if (!slug) {
        return []
      }

      return centerSlugs.map((center) => ({
        castingStatusSlug: slug,
        slug: center,
      }))
    })
  } catch {
    return []
  }
}

export async function CastingStatusDetailPage({
  center,
  slug,
}: {
  center: CenterSlug
  slug: string
}) {
  const casting = await queryCastingStatusBySlug({ center, slug }).catch(() => null)

  if (!casting) {
    notFound()
  }

  const imageUrl = normalizeImageUrl(casting.thumbnailPath)
  const infoItems = [
    { label: '편성', value: casting.broadcaster },
    { label: '제작사', value: casting.productionCompany },
    { label: '연출', value: casting.directors },
    { label: '극본', value: casting.writers },
    { label: '캐스팅', value: casting.castingCompany },
  ].filter((item) => normalizeText(item.value))
  const castMembers = normalizeCastMembers(casting.castMembers)
  const adjacent = await queryAdjacentCastingStatus({ center, slug: casting.slug })

  return (
    <DetailPage center={center} className="page-casting-status-detail">
      <DetailBackLink
        href={`/${center}/casting-status`}
        label="진행중인 캐스팅 출연현황"
        width="wide"
      />

      <DetailContainer width="wide">
        <header className="section-casting-status-detail__header mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-center md:justify-between">
          <h1 className="type-headline-l font-extrabold leading-[1.35] text-foreground md:type-headline-xl">
            {casting.title}
          </h1>
          <time
            className="shrink-0 type-body-s font-medium leading-normal text-muted-foreground"
            dateTime={casting.publishedAt ?? casting.createdAt}
          >
            {formatDate(casting.publishedAt ?? casting.createdAt)}
          </time>
        </header>

        <div className="section-casting-status-detail__content grid gap-5 lg:grid-cols-[457px_minmax(0,1fr)] lg:items-start">
          <div className="section-casting-status-detail__poster relative aspect-2/3 w-full overflow-hidden bg-neutral-950">
            {imageUrl ? (
              <Image
                alt={`${casting.title} 포스터`}
                className="size-full object-cover"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 457px"
                src={imageUrl}
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted type-label-l font-semibold text-muted-foreground">
                NO IMAGE
              </div>
            )}
          </div>

          <aside className="section-casting-status-detail__aside flex flex-col gap-6 border border-border bg-white p-6 md:p-8">
            <div className="section-casting-status-detail__status flex items-start justify-between gap-4 border-b border-border pb-6 md:pb-8">
              <h2 className="type-title-l font-extrabold leading-[1.35] text-foreground">
                캐스팅 현황
              </h2>
              {casting.castingStatus && (
                <span className="rounded-full bg-muted px-3 py-1 type-label-s font-medium leading-[1.6] text-foreground">
                  {casting.castingStatus}
                </span>
              )}
            </div>

            {infoItems.length > 0 && (
              <dl className="section-casting-status-detail__info space-y-5 border-b border-border pb-6 type-body-s leading-normal md:pb-8">
                {infoItems.map((item) => (
                  <div className="grid grid-cols-[100px_1fr] gap-4" key={item.label}>
                    <dt className="font-bold text-foreground">{item.label}</dt>
                    <dd className="text-neutral-600">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <section
              aria-labelledby="casting-status-cast-title"
              className="section-casting-status-detail__cast overflow-hidden rounded-xl bg-muted"
            >
              <h2 className="sr-only" id="casting-status-cast-title">
                출연 배우
              </h2>
              <div className="grid grid-cols-[minmax(78px,100px)_minmax(92px,148px)_minmax(0,1fr)] gap-4 bg-neutral-200 px-5 py-4 type-label-s font-bold leading-[1.35] text-foreground md:px-6">
                <span>배우</span>
                <span>역할</span>
                <span>회차</span>
              </div>
              {castMembers.length > 0 ? (
                <div>
                  {castMembers.map((member, index) => (
                    <div
                      className="grid grid-cols-[minmax(78px,100px)_minmax(92px,148px)_minmax(0,1fr)] gap-4 border-b border-black/6 px-5 py-4 type-label-m font-medium leading-[1.6] text-foreground last:border-b-0 md:px-6"
                      key={`${member.actorName}-${member.roleName}-${index}`}
                    >
                      <span>{member.actorName || '배우명 미정'}</span>
                      <span>{member.roleName || '-'}</span>
                      <EpisodeList episodeNumbers={member.episodeNumbers} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-8 text-center type-label-m font-semibold text-muted-foreground md:px-6">
                  출연 배우 정보 준비중
                </p>
              )}
            </section>
          </aside>
        </div>
      </DetailContainer>

      <DetailPager
        nextHref={adjacent.nextHref}
        nextLabel={adjacent.nextLabel}
        previousHref={adjacent.previousHref}
        previousLabel={adjacent.previousLabel}
        width="wide"
      />
    </DetailPage>
  )
}

export async function generateCastingStatusMetadata({
  center,
  slug,
}: {
  center: CenterSlug
  slug: string
}): Promise<Metadata> {
  const casting = await queryCastingStatusBySlug({ center, slug }).catch(() => null)

  return {
    title: casting?.title
      ? `${casting.title} | ${getCenterLabel(center)} 캐스팅 출연현황`
      : `${getCenterLabel(center)} 캐스팅 출연현황`,
  }
}

const queryCastingStatusBySlug = cache(
  async ({ center, slug }: { center: CenterSlug; slug: string }) => {
    const { isEnabled: draft } = await draftMode()
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'casting-appearances',
      depth: 0,
      limit: 1,
      overrideAccess: draft,
      pagination: false,
      where: {
        and: [
          {
            slug: {
              equals: slug,
            },
          },
          createCenterWhere(center),
          ...(draft
            ? []
            : [
                {
                  displayStatus: {
                    equals: 'published',
                  },
                },
              ]),
        ],
      },
    })

    return (result.docs?.[0] as CastingAppearance | undefined) || null
  },
)

const queryAdjacentCastingStatus = cache(
  async ({ center, slug }: { center: CenterSlug; slug: string }) => {
    const payload = await getPayload({ config: configPromise })
    const result = await payload
      .find({
        collection: 'casting-appearances',
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        select: {
          slug: true,
          title: true,
        },
        sort: '-publishedAt',
        where: {
          and: [
            {
              displayStatus: {
                equals: 'published',
              },
            },
            createCenterWhere(center),
          ],
        },
      })
      .catch(() => ({ docs: [] }))

    const index = result.docs.findIndex((item) => item.slug === slug)
    const previous = index >= 0 ? result.docs[index + 1] : undefined
    const next = index > 0 ? result.docs[index - 1] : undefined
    const pathPrefix = `/${center}/casting-status`

    return {
      nextHref: next?.slug ? `${pathPrefix}/${encodeURIComponent(next.slug)}` : null,
      nextLabel: next?.title || '다음 캐스팅',
      previousHref: previous?.slug ? `${pathPrefix}/${encodeURIComponent(previous.slug)}` : null,
      previousLabel: previous?.title || '이전 캐스팅',
    }
  },
)

function EpisodeList({ episodeNumbers }: { episodeNumbers: string }) {
  const episodes = splitEpisodeNumbers(episodeNumbers)

  if (episodes.length === 0) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <span className="flex min-w-0 flex-wrap gap-1">
      {episodes.map((episode) => (
        <span
          className="inline-flex size-6 items-center justify-center rounded-full bg-neutral-200 type-caption-s font-bold leading-none text-foreground"
          key={episode}
        >
          {episode}
        </span>
      ))}
    </span>
  )
}

function createCenterWhere(center: CenterSlug) {
  return {
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
  }
}

function getStaticParamCenters(value: CastingAppearance['centers']) {
  const centerSlugs = Object.keys(centers) as CenterSlug[]

  if (value.includes('all')) {
    return centerSlugs
  }

  return value.filter((center): center is CenterSlug => center in centers)
}

function normalizeCastMembers(value: CastingAppearance['castMembers']) {
  return (
    value
      ?.map((member) => ({
        actorName: normalizeText(member.actorName),
        episodeNumbers: normalizeText(member.episodeNumbers),
        roleName: normalizeText(member.roleName),
      }))
      .filter((member) => member.actorName || member.roleName || member.episodeNumbers) ?? []
  )
}

function splitEpisodeNumbers(value: string) {
  return value
    .split(/[,\s/]+/)
    .map((item) => item.trim().replace(/회차?$/, ''))
    .filter(Boolean)
}

function normalizeImageUrl(value: string | null | undefined) {
  const trimmed = normalizeText(value)

  if (!trimmed) {
    return ''
  }

  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/')) {
    return getMediaUrl(trimmed)
  }

  return getMediaUrl(`/${trimmed.replace(/^\/+/, '')}`)
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}. ${month}. ${day}`
}
