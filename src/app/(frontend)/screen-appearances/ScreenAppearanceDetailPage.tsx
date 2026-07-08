import type { Metadata } from 'next'

import { centers, type CenterSlug } from '@/lib/centers'
import type {
  Media as PayloadMedia,
  Profile,
  ScreenAppearance,
} from '@/payload-types'
import { formatMultilineText } from '@/utilities/formatMultilineText'
import configPromise from '@payload-config'
import { ChevronRight } from 'lucide-react'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import {
  DetailBackLink,
  DetailContainer,
  DetailHeader,
  DetailMedia,
  DetailPage,
  DetailPager,
} from '../_components/DetailLayout'
import { PUBLIC_DETAIL_STATIC_PARAMS_LIMIT } from '../staticGeneration'
import { ScreenAppearanceProfileAvatar } from './ScreenAppearanceProfileAvatar.client'
import { screenAppearanceProfileImageUrl } from './screenAppearanceProfileImage'

type PerformerInfo = {
  className?: string | null
  name: string
  profileHref?: string | null
  profileImageMedia?: PayloadMedia | null
}

type CareerItem = NonNullable<ScreenAppearance['careerItems']>[number]

type CareerGroup = {
  items: CareerItem[]
  name?: string
}

export async function generateScreenAppearanceStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const params: Array<{ screenAppearanceSlug: string; slug: CenterSlug }> = []

    for (const center of Object.keys(centers) as CenterSlug[]) {
      const result = await payload.find({
        collection: 'screen-appearances',
        limit: PUBLIC_DETAIL_STATIC_PARAMS_LIMIT,
        overrideAccess: false,
        pagination: false,
        select: {
          centers: true,
          slug: true,
        },
        sort: '-publishedAt',
        where: {
          and: [
            {
              displayStatus: {
                equals: 'published',
              },
            },
            {
              centers: {
                equals: center,
              },
            },
          ],
        },
      })

      params.push(
        ...result.docs.flatMap((appearance) => {
          const id = appearance.id

          if (!id) {
            return []
          }

          return [{ screenAppearanceSlug: String(id), slug: center }]
        }),
      )
    }

    return params
  } catch {
    return []
  }
}

export async function ScreenAppearanceDetailPage({
  center,
  slug,
}: {
  center: CenterSlug
  slug: string
}) {
  const appearance = await queryScreenAppearanceBySlug({ center, slug }).catch(() => null)

  if (!appearance) {
    notFound()
  }

  const projectTitle = appearance.projectTitle?.trim() || appearance.title
  const broadcastStation = getBroadcastStation(appearance.broadcastStation)
  const meta = [broadcastStation?.stationName, getAppearanceTypeLabel(appearance.appearanceType)]
    .filter(Boolean)
    .join(' · ')
  const performer = getPerformer(appearance, center)
  const bodyImages = getBodyImages(appearance)
  const mainImage = bodyImages[0]
  const secondaryImages = bodyImages.slice(1)
  const infoItems = [
    // { label: '출연자', value: performer.name },
    { label: '작품명', value: appearance.projectTitle },
    { label: '역할', value: appearance.roleName },
    { label: '반/클래스', value: performer.className },
    { label: '방영일', value: formatDate(appearance.airDateLabel) },
  ].filter((item) => item.value)
  const careerGroups = getCareerGroups(appearance)
  const adjacent = await queryAdjacentScreenAppearances({ center, id: appearance.id })
  const backHref = `/${center}/screen-appearances`
  const backLabel = 'BNB 출연장면'

  return (
    <DetailPage center={center} className="page-screen-appearances-detail">
      <DetailBackLink href={backHref} label={backLabel} width="wide" />

      <DetailContainer width="wide">
        <DetailHeader
          dateTime={appearance.publishedAt ?? appearance.createdAt}
          description={appearance.introText}
          eyebrow={meta}
          title={projectTitle}
        />

        <div className="section-screen-appearance-detail__content grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="section-screen-appearance-detail__media space-y-5">
            {mainImage ? (
              <DetailMedia
                alt={projectTitle}
                className="rounded-xl overflow-hidden"
                priority
                resource={mainImage}
                size="(max-width: 1023px) 100vw, 760px"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl bg-muted type-label-l font-semibold text-muted-foreground">
                NO IMAGE
              </div>
            )}

            {secondaryImages.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {secondaryImages.map((image, index) => (
                  <DetailMedia
                    alt={`${projectTitle} 출연장면 ${index + 2}`}
                    className="rounded-xl overflow-hidden"
                    key={`${image.id}-${index}`}
                    resource={image}
                    size="(max-width: 639px) 100vw, 380px"
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="section-screen-appearance-detail__aside rounded-xl border border-border bg-white p-6 md:p-8">
            <div className="flex items-center gap-4 border-b border-border pb-6">
              <ScreenAppearanceProfileAvatar
                imageUrl={screenAppearanceProfileImageUrl(performer.profileImageMedia)}
                size="detail"
              />
              <div className="min-w-0">
                <p className="type-label-m font-bold leading-[1.35] text-brand">출연자</p>
                <h2 className="type-title-m font-extrabold leading-[1.35] text-foreground">
                  {performer.profileHref ? (
                    <Link
                      aria-label={`${performer.name} 프로필 보기`}
                      className="inline-flex max-w-full items-center gap-1 transition-colors hover:text-brand"
                      href={performer.profileHref}
                    >
                      <span className="line-clamp-2 min-w-0">{performer.name}</span>
                      <ChevronRight aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.4} />
                    </Link>
                  ) : (
                    <span className="line-clamp-2">{performer.name}</span>
                  )}
                </h2>
              </div>
            </div>

            {infoItems.length > 0 && (
              <dl className="type-body-s leading-[1.55]">
                {infoItems.map((item) => (
                  <div className="grid grid-cols-[84px_1fr] gap-4 border-b border-border py-4" key={item.label}>
                    <dt className="font-bold text-foreground">{item.label}</dt>
                    <dd className="text-muted-foreground">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {careerGroups.length > 0 && (
              <section className="mt-8">
                <h2 className="type-title-s font-extrabold leading-[1.35] text-foreground">
                  필모그래피
                </h2>
                <dl className="mt-4 type-body-s leading-[1.55]">
                  {careerGroups.map((group, groupIndex) => (
                    <React.Fragment key={group.name ?? `career-group-${groupIndex}`}>
                      {group.name && careerGroups.length > 1 && (
                        <div className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                          <dt className="type-label-m font-extrabold text-brand">{group.name}</dt>
                        </div>
                      )}
                      {group.items.map((item, itemIndex) => (
                        <div
                          className="border-t border-border py-4 first:border-t-0 first:pt-0"
                          key={item.id ?? `${group.name ?? 'career'}-${item.title}-${itemIndex}`}
                        >
                          <dt className="font-bold text-foreground">{item.title}</dt>
                          {item.content && (
                            <dd className="mt-2 whitespace-pre-line text-muted-foreground">
                              {formatMultilineText(item.content)}
                            </dd>
                          )}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </dl>
              </section>
            )}
          </aside>
        </div>
      </DetailContainer>

      <DetailPager
        listHref={backHref}
        listLabel={backLabel}
        nextHref={adjacent.nextHref}
        nextLabel={adjacent.nextLabel}
        previousHref={adjacent.previousHref}
        previousLabel={adjacent.previousLabel}
        width="wide"
      />
    </DetailPage>
  )
}

export async function generateScreenAppearanceMetadata({
  center,
  slug,
}: {
  center: CenterSlug
  slug: string
}): Promise<Metadata> {
  const appearance = await queryScreenAppearanceBySlug({ center, slug }).catch(() => null)
  const title = appearance?.projectTitle?.trim() || appearance?.title

  return {
    description: appearance?.introText || undefined,
    title: title || 'BNB 출연장면',
  }
}

const queryScreenAppearanceBySlug = cache(
  async ({ center, slug }: { center: CenterSlug; slug: string }) => {
    const { isEnabled: draft } = await draftMode()
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'screen-appearances',
      depth: 2,
      limit: 1,
      overrideAccess: draft,
      pagination: false,
      where: {
        and: [
          {
            id: {
              equals: slug,
            },
          },
          {
            centers: {
              equals: center,
            },
          },
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

    return (result.docs?.[0] as ScreenAppearance | undefined) || null
  },
)

const queryAdjacentScreenAppearances = cache(
  async ({ center, id }: { center: CenterSlug; id: number }) => {
    const payload = await getPayload({ config: configPromise })
    const result = await payload
      .find({
        collection: 'screen-appearances',
        depth: 1,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        select: {
          actorInputMode: true,
          linkedProfiles: true,
          performerName: true,
          projectTitle: true,
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
            {
              centers: {
                equals: center,
              },
            },
          ],
        },
      })
      .catch(() => ({ docs: [] }))

    const index = result.docs.findIndex((item) => item.id === id)
    const previous = index >= 0 ? result.docs[index + 1] : undefined
    const next = index > 0 ? result.docs[index - 1] : undefined
    const pathPrefix = `/${center}/screen-appearances`

    return {
      nextHref: next?.id ? `${pathPrefix}/${encodeURIComponent(String(next.id))}` : null,
      nextLabel: next ? formatAdjacentLabel(next, '다음 출연장면') : '다음 출연장면',
      previousHref: previous?.id ? `${pathPrefix}/${encodeURIComponent(String(previous.id))}` : null,
      previousLabel: previous ? formatAdjacentLabel(previous, '이전 출연장면') : '이전 출연장면',
    }
  },
)

function getPerformer(appearance: ScreenAppearance, center: CenterSlug): PerformerInfo {
  if (appearance.actorInputMode === 'manual') {
    return {
      className: normalizeText(appearance.className),
      name: appearance.performerName?.trim() || '배우앤배움 수강생',
      profileImageMedia:
        appearance.profileImageMedia && typeof appearance.profileImageMedia === 'object'
          ? appearance.profileImageMedia
          : null,
    }
  }

  const profiles = appearance.linkedProfiles
    ?.filter((profile): profile is Profile => typeof profile === 'object' && profile !== null)
    .filter((profile) => Boolean(profile.name))
  const profile = profiles?.[0]
  const names = profiles?.map((item) => item.name).join(', ')

  return {
    className: getProfileClassName(profiles) || normalizeText(appearance.className),
    name: names || appearance.performerName?.trim() || '배우앤배움 수강생',
    profileHref: profile?.slug ? `/${center}/profiles/${encodeURIComponent(profile.slug)}` : null,
    profileImageMedia:
      profile?.profileImageMedia && typeof profile.profileImageMedia === 'object'
        ? profile.profileImageMedia
        : null,
  }
}

function getProfileClassName(profiles: Profile[] | undefined) {
  const classNames = profiles
    ?.map((profile) => normalizeText(profile.className))
    .filter((className): className is string => Boolean(className))

  return classNames && classNames.length > 0 ? Array.from(new Set(classNames)).join(', ') : null
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() || null
}

function getCareerGroups(appearance: ScreenAppearance): CareerGroup[] {
  const documentCareerItems = getCareerItems(appearance.careerItems)

  if (appearance.actorInputMode === 'manual') {
    return documentCareerItems.length > 0 ? [{ items: documentCareerItems }] : []
  }

  const profileCareerGroups =
    appearance.linkedProfiles
      ?.filter((profile): profile is Profile => typeof profile === 'object' && profile !== null)
      .map((profile) => ({
        items: getCareerItems(profile.careerItems),
        name: profile.name?.trim(),
      }))
      .filter((group) => group.items.length > 0) ?? []

  return profileCareerGroups.length > 0
    ? profileCareerGroups
    : documentCareerItems.length > 0
      ? [{ items: documentCareerItems }]
      : []
}

function getCareerItems(items: Profile['careerItems'] | ScreenAppearance['careerItems']) {
  return items?.filter((item) => item.title || item.content) ?? []
}

function formatAdjacentLabel(
  appearance: Pick<
    ScreenAppearance,
    'actorInputMode' | 'linkedProfiles' | 'performerName' | 'projectTitle' | 'title'
  >,
  fallback: string,
) {
  const projectTitle = appearance.projectTitle?.trim() || appearance.title?.trim()
  const performerName = getPerformerName(appearance)
  const label = [projectTitle, performerName].filter(Boolean).join('-')

  return label || fallback
}

function getPerformerName(
  appearance: Pick<ScreenAppearance, 'actorInputMode' | 'linkedProfiles' | 'performerName'>,
) {
  if (appearance.actorInputMode === 'manual') {
    return appearance.performerName?.trim()
  }

  const names = appearance.linkedProfiles
    ?.filter((profile): profile is Profile => typeof profile === 'object' && profile !== null)
    .map((profile) => profile.name?.trim())
    .filter(Boolean)
    .join(', ')

  return names || appearance.performerName?.trim()
}

function getBroadcastStation(value: ScreenAppearance['broadcastStation']) {
  return value && typeof value === 'object' ? value : null
}

function getBodyImages(appearance: ScreenAppearance) {
  return (
    appearance.bodyImages
      ?.map((item) => item.image)
      .filter((image): image is PayloadMedia => typeof image === 'object' && image !== null) ?? []
  )
}

function getAppearanceTypeLabel(value: ScreenAppearance['appearanceType']) {
  if (value === 'commercial') {
    return '광고 출연장면'
  }

  if (value === 'movie') {
    return '영화 출연장면'
  }

  return '드라마 출연장면'
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}. ${month}. ${day}`
}
