import type { Metadata } from 'next'

import { Media } from '@/components/Media/Renderer'
import { centers, type CenterSlug } from '@/lib/centers'
import type { Media as PayloadMedia, Profile } from '@/payload-types'
import { formatMultilineText } from '@/utilities/formatMultilineText'
import { publishedImageSrc } from '@/utilities/publishedImageSrc'
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

export type ProfileDetailParams = {
  center?: string
  slug?: string
}

export async function generateProfileStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'profiles',
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

    return result.docs.flatMap((profile) => {
      const slug = profile.slug

      if (!slug) {
        return []
      }

      return profileCenterSlugs(profile as Profile).map((center) => ({ center, slug }))
    })
  } catch {
    return []
  }
}

export async function ProfileDetailPage({
  center,
  slug,
}: {
  center?: CenterSlug
  slug: string
}) {
  const profile = await queryProfileBySlug({ center, slug }).catch(() => null)

  if (!profile) {
    notFound()
  }

  const image = profile.profileImageMedia
  const legacyImagePath = publishedImageSrc(profile.profileImagePath) || undefined
  const hasMediaImage = image && typeof image === 'object'
  const careerItems = profile.careerItems ?? []
  const profileImages = [
    hasMediaImage ? { resource: image, type: 'media' as const } : null,
    !hasMediaImage && legacyImagePath ? { src: legacyImagePath, type: 'legacy' as const } : null,
    ...[
      profile.photoImage1,
      profile.photoImage2,
      profile.photoImage3,
      profile.photoImage4,
      profile.photoImage5,
      profile.photoImage6,
    ]
      .map(publishedImageSrc)
      .filter((src): src is string => Boolean(src))
      .map((src) => ({ src, type: 'legacy' as const })),
  ].filter((item): item is ProfileImageItem => Boolean(item))
  const [primaryImage, ...thumbnailImages] = profileImages
  const backHref = center ? `/${center}/rookies` : '/profiles'
  const backLabel = center ? 'BNB 루키' : '프로필'
  const adjacent = await queryAdjacentProfiles({ center, slug: profile.slug })

  return (
    <DetailPage center={center}>
      <DetailBackLink href={backHref} label={backLabel} width="wide" />

      <DetailContainer width="wide">
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="overflow-hidden bg-muted">
              {primaryImage ? (
                <ProfileImage
                  alt={profile.name}
                  image={primaryImage}
                  imgClassName="aspect-[55/64] h-auto w-full object-cover object-top"
                  priority
                  size="(max-width: 1023px) 100vw, 550px"
                />
              ) : (
                <div className="aspect-[55/64] w-full bg-muted" />
              )}
            </div>

            {thumbnailImages.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {thumbnailImages.slice(0, 6).map((thumbnail, index) => (
                  <div className="overflow-hidden bg-muted" key={`${thumbnail.type}-${index}`}>
                    <ProfileImage
                      alt={`${profile.name} 이미지 ${index + 2}`}
                      image={thumbnail}
                      imgClassName="aspect-square h-auto w-full object-cover object-top"
                      size="104px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-border p-8 md:p-10">
            <header className="border-b border-border pb-8">
              <h1 className="type-headline-xl font-extrabold leading-[1.35] text-foreground">
                {profile.name}
              </h1>
              {profile.englishName && (
                <p className="mt-2 type-label-l font-semibold leading-[1.35] text-muted-foreground">
                  {profile.englishName}
                </p>
              )}
            </header>

            <dl className="mt-8 space-y-5 type-body-m leading-[1.55]">
              {profile.height && (
                <div className="grid grid-cols-[100px_1fr] gap-4">
                  <dt className="font-extrabold text-foreground">키</dt>
                  <dd className="text-muted-foreground">{profile.height}</dd>
                </div>
              )}
              {profile.weight && (
                <div className="grid grid-cols-[100px_1fr] gap-4">
                  <dt className="font-extrabold text-foreground">몸무게</dt>
                  <dd className="text-muted-foreground">{profile.weight}</dd>
                </div>
              )}
              {profile.filter && (
                <div className="grid grid-cols-[100px_1fr] gap-4">
                  <dt className="font-extrabold text-foreground">구분</dt>
                  <dd className="text-muted-foreground">{profile.filter}</dd>
                </div>
              )}
            </dl>

            {careerItems.length > 0 && (
              <section className="mt-10 space-y-6">
                {careerItems.map((item) => (
                  <div
                    className="grid gap-4 type-body-m leading-[1.55] md:grid-cols-[100px_1fr]"
                    key={item.id ?? item.title}
                  >
                    <h2 className="font-extrabold text-foreground">{item.title}</h2>
                    {item.content && (
                      <p className="whitespace-pre-line text-muted-foreground">
                        {formatMultilineText(item.content)}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </DetailContainer>

      <DetailPager
        listHref={backHref}
        listLabel={backLabel}
        nextHref={adjacent.nextHref}
        previousHref={adjacent.previousHref}
        width="wide"
      />
    </DetailPage>
  )
}

export async function generateProfileMetadata({
  center,
  slug,
}: {
  center?: CenterSlug
  slug: string
}): Promise<Metadata> {
  const profile = await queryProfileBySlug({ center, slug }).catch(() => null)

  if (!profile) {
    return {
      title: '프로필',
    }
  }

  return {
    description: [profile.englishName, profile.filter].filter(Boolean).join(' / ') || undefined,
    title: profile.name || '프로필',
  }
}

export async function profileCanonicalPath(slug: string) {
  const profile = await queryProfileBySlug({ slug }).catch(() => null)

  if (!profile) {
    return null
  }

  const [center] = profileCenterSlugs(profile)

  if (!center) {
    return null
  }

  return `/${center}/profiles/${encodeURIComponent(profile.slug || slug)}`
}

const queryProfileBySlug = cache(async ({ center, slug }: { center?: CenterSlug; slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 1,
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

  const profile = (result.docs?.[0] as Profile | undefined) || null

  if (!profile || (center && !profileBelongsToCenter(profile, center))) {
    return null
  }

  return profile
})

const queryAdjacentProfiles = cache(
  async ({ center, slug }: { center?: CenterSlug; slug: string }) => {
    const payload = await getPayload({ config: configPromise })
    const result = await payload
      .find({
        collection: 'profiles',
        depth: 0,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        select: {
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
            ...(center
              ? [
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
                ]
              : []),
          ],
        },
      })
      .catch(() => ({ docs: [] }))

    const index = result.docs.findIndex((item) => item.slug === slug)
    const previous = index >= 0 ? result.docs[index + 1] : undefined
    const next = index > 0 ? result.docs[index - 1] : undefined
    const pathPrefix = center ? `/${center}/profiles` : '/profiles'

    return {
      nextHref: next?.slug ? `${pathPrefix}/${encodeURIComponent(next.slug)}` : null,
      previousHref: previous?.slug ? `${pathPrefix}/${encodeURIComponent(previous.slug)}` : null,
    }
  },
)

function profileBelongsToCenter(profile: Profile, center: CenterSlug) {
  return profile.centers.includes('all') || profile.centers.includes(center)
}

function profileCenterSlugs(profile: Profile) {
  if (profile.centers.includes('all')) {
    return Object.keys(centers) as CenterSlug[]
  }

  return profile.centers.filter((center): center is CenterSlug => center in centers)
}

type ProfileImageItem =
  | {
      resource: PayloadMedia
      type: 'media'
    }
  | {
      src: string
      type: 'legacy'
    }

function ProfileImage({
  alt,
  image,
  imgClassName,
  priority,
  size,
}: {
  alt: string
  image: ProfileImageItem
  imgClassName: string
  priority?: boolean
  size: string
}) {
  if (image.type === 'media') {
    return (
      <Media
        htmlElement={null}
        imgClassName={imgClassName}
        pictureClassName="block w-full"
        priority={priority}
        resource={image.resource}
        size={size}
      />
    )
  }

  return (
    <Image
      alt={alt}
      className={imgClassName}
      height={1200}
      priority={priority}
      src={image.src}
      unoptimized
      width={900}
    />
  )
}
