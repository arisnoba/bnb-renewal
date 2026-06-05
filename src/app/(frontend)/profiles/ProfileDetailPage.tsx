import type { Metadata } from 'next'

import { Media } from '@/components/Media/Renderer'
import { centers, getCenterLabel, type CenterSlug } from '@/lib/centers'
import type { Profile } from '@/payload-types'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

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
  const legacyImagePath = profile.profileImagePath || undefined
  const hasMediaImage = image && typeof image === 'object'
  const careerItems = profile.careerItems ?? []

  return (
    <article className="pt-20 pb-24 page-detail">
      <div className="container grid gap-12 lg:grid-cols-[minmax(280px,420px)_1fr] lg:items-start">
        <div className="overflow-hidden rounded-lg bg-muted">
          {hasMediaImage ? (
            <Media
              imgClassName="h-auto w-full object-cover"
              pictureClassName="block w-full"
              priority
              resource={image}
              size="(max-width: 1024px) 100vw, 420px"
            />
          ) : legacyImagePath ? (
            <Image
              alt={profile.name}
              className="h-auto w-full object-cover"
              height={1200}
              priority
              src={legacyImagePath}
              unoptimized
              width={900}
            />
          ) : (
            <div className="aspect-[3/4] w-full bg-muted" />
          )}
        </div>

        <div>
          <div className="mb-5 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {profile.centers.map((profileCenter) => (
              <span className="rounded-full border border-border px-3 py-1" key={profileCenter}>
                {profileCenter === 'all' ? '전체' : getCenterLabel(profileCenter)}
              </span>
            ))}
            {profile.filter && (
              <span className="rounded-full border border-border px-3 py-1">{profile.filter}</span>
            )}
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-normal md:text-6xl">
            {profile.name}
          </h1>
          <p className="mt-3 text-xl text-muted-foreground">{profile.englishName}</p>

          {(profile.height || profile.weight) && (
            <dl className="mt-8 grid max-w-sm grid-cols-2 gap-4 text-sm">
              {profile.height && (
                <div>
                  <dt className="text-muted-foreground">키</dt>
                  <dd className="mt-1 text-lg font-medium">{profile.height}</dd>
                </div>
              )}
              {profile.weight && (
                <div>
                  <dt className="text-muted-foreground">몸무게</dt>
                  <dd className="mt-1 text-lg font-medium">{profile.weight}</dd>
                </div>
              )}
            </dl>
          )}

          {careerItems.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold">경력</h2>
              <div className="mt-6 divide-y divide-border border-y border-border">
                {careerItems.map((item) => (
                  <div className="grid gap-3 py-5 md:grid-cols-[140px_1fr]" key={item.id ?? item.title}>
                    <h3 className="font-medium">{item.title}</h3>
                    {item.content && (
                      <p className="whitespace-pre-line leading-7 text-muted-foreground">
                        {item.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
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

  const centerLabel = center ? getCenterLabel(center) : undefined

  return {
    description: [profile.englishName, profile.filter].filter(Boolean).join(' / ') || undefined,
    title: [profile.name, centerLabel].filter(Boolean).join(' | '),
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

function profileBelongsToCenter(profile: Profile, center: CenterSlug) {
  return profile.centers.includes('all') || profile.centers.includes(center)
}

function profileCenterSlugs(profile: Profile) {
  if (profile.centers.includes('all')) {
    return Object.keys(centers) as CenterSlug[]
  }

  return profile.centers.filter((center): center is CenterSlug => center in centers)
}
