import type { Metadata } from 'next'

import { Media } from '@/components/Media/Renderer'
import { getPageDecoIcons, PageDeco } from '@/components/PageDeco'
import { centers, getCenterLabel, type CenterSlug } from '@/lib/centers'
import type { Media as PayloadMedia, Teacher } from '@/payload-types'
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
import { TeacherDetailGallery, type TeacherImageItem } from './TeacherDetailGallery.client'

type TeacherRepresentativeWork = NonNullable<Teacher['representativeWorks']>[number] & {
  posterMedia?: number | PayloadMedia | null
}

export async function generateTeacherStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'teachers',
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        centers: true,
        slug: true,
      },
      where: {
        status: {
          equals: 'published',
        },
      },
    })

    return result.docs.flatMap((teacher) => {
      const slug = teacher.slug

      if (!slug) {
        return []
      }

      return teacherCenterSlugs(teacher as Teacher).map((center) => ({ center, slug }))
    })
  } catch {
    return []
  }
}

export async function TeacherDetailPage({
  center,
  slug,
}: {
  center: CenterSlug
  slug: string
}) {
  const teacher = await queryTeacherBySlug({ center, slug }).catch(() => null)

  if (!teacher) {
    notFound()
  }

  const decoIcons = getPageDecoIcons(2, `teacher-detail-${center}-${teacher.slug}`)
  const image = teacher.profileImageMedia
  const hasMediaImage = image && typeof image === 'object'
  const teacherImages = [
    hasMediaImage ? { resource: image, type: 'media' as const } : null,
    ...[
      teacher.photoImage1,
      teacher.photoImage2,
      teacher.photoImage3,
      teacher.photoImage4,
      teacher.photoImage5,
      teacher.photoImage6,
    ]
      .filter((src): src is string => Boolean(src))
      .map((src) => ({ src, type: 'legacy' as const })),
  ].filter((item): item is TeacherImageItem => Boolean(item))
  const careerItems = teacher.careerItems ?? []
  const representativeWorks = ((teacher.representativeWorks ?? []) as TeacherRepresentativeWork[])
    .filter((work) => work.title || work.description || work.posterMedia || work.posterPath)
    .slice(0, 8)
  const adjacent = await queryAdjacentTeachers({ center, slug: teacher.slug })

  return (
    <DetailPage
      center={center}
      className="page-teacher-detail relative overflow-hidden"
      sectionClassName="relative z-10"
      tone="dark"
    >
      <PageDeco
        className="right-[8%] top-[34rem] hidden size-[360px] lg:block"
        icon={decoIcons[0]}
      />
      <PageDeco
        className="-left-24 top-[62rem] hidden size-[360px] lg:block"
        icon={decoIcons[1]}
      />

      <DetailBackLink href={`/${center}/teachers`} label="교육진 소개" width="wide" />

      <DetailContainer width="wide">
        <div className="section-teacher-detail__profile grid gap-5 lg:grid-cols-2 lg:items-start">
          <TeacherDetailGallery images={teacherImages} teacherName={teacher.name} />

          <section className="section-teacher-detail__info bg-black p-6 md:p-8">
            <header className="flex items-start justify-between gap-5 border-b border-white/10 pb-8">
              <div>
                <h1 className="type-headline-m font-bold leading-[1.35] text-white">
                  {teacher.name}
                </h1>
                {teacher.summary && (
                  <p className="mt-2 type-body-m leading-[1.5] text-white/60">
                    {teacher.summary}
                  </p>
                )}
              </div>
            </header>

            {careerItems.length > 0 && (
              <dl className="type-body-m leading-[1.5] text-white">
                {careerItems.map((item) => (
                  <div
                    className="grid gap-4 border-b border-white/10 py-6 md:grid-cols-[100px_1fr]"
                    key={item.id ?? item.title}
                  >
                    <dt className="font-bold">{item.title}</dt>
                    {item.content && (
                      <dd className="whitespace-pre-line text-white/60">
                        {formatMultilineText(item.content)}
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>

        {representativeWorks.length > 0 && (
          <section className="section-teacher-detail__works mt-16 border-t border-white/10 py-10">
            <h2 className="type-title-m font-bold leading-[1.4] text-white">대표작품</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-4 lg:grid-cols-8">
              {representativeWorks.map((work, index) => (
                <RepresentativeWorkCard
                  key={work.id ?? `${work.title ?? 'work'}-${index}`}
                  work={work}
                />
              ))}
            </div>
          </section>
        )}
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

export async function generateTeacherMetadata({
  center,
  slug,
}: {
  center: CenterSlug
  slug: string
}): Promise<Metadata> {
  const teacher = await queryTeacherBySlug({ center, slug }).catch(() => null)

  if (!teacher) {
    return {
      title: '교육진 소개',
    }
  }

  return {
    description: teacher.summary || teacher.role || undefined,
    title: [teacher.name, '교육진 소개', getCenterLabel(center)].filter(Boolean).join(' | '),
  }
}

const queryTeacherBySlug = cache(async ({ center, slug }: { center: CenterSlug; slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'teachers',
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
                status: {
                  equals: 'published',
                },
              },
            ]),
      ],
    },
  })

  const teacher = (result.docs?.[0] as Teacher | undefined) || null

  if (!teacher || !teacherBelongsToCenter(teacher, center)) {
    return null
  }

  return teacher
})

const queryAdjacentTeachers = cache(async ({ center, slug }: { center: CenterSlug; slug: string }) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload
    .find({
      collection: 'teachers',
      depth: 0,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        name: true,
        slug: true,
      },
      sort: 'displayOrder',
      where: {
        and: [
          {
            status: {
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
    })
    .catch(() => ({ docs: [] }))

  const index = result.docs.findIndex((item) => item.slug === slug)
  const previous = index > 0 ? result.docs[index - 1] : undefined
  const next = index >= 0 ? result.docs[index + 1] : undefined
  const pathPrefix = `/${center}/teachers`

  return {
    nextHref: next?.slug ? `${pathPrefix}/${encodeURIComponent(next.slug)}` : null,
    nextLabel: next?.name ? `배우 ${next.name}` : '다음 강사',
    previousHref: previous?.slug ? `${pathPrefix}/${encodeURIComponent(previous.slug)}` : null,
    previousLabel: previous?.name ? `배우 ${previous.name}` : '이전 강사',
  }
})

function teacherBelongsToCenter(teacher: Teacher, center: CenterSlug) {
  return teacher.centers.includes('all') || teacher.centers.includes(center)
}

function teacherCenterSlugs(teacher: Teacher) {
  if (teacher.centers.includes('all')) {
    return Object.keys(centers) as CenterSlug[]
  }

  return teacher.centers.filter((center): center is CenterSlug => center in centers)
}

function RepresentativeWorkCard({ work }: { work: TeacherRepresentativeWork }) {
  const media = work.posterMedia
  const hasPosterMedia = media && typeof media === 'object'

  return (
    <article className="section-teacher-detail__work">
      <div className="aspect-[129.5/176] overflow-hidden rounded-[6px] bg-white">
        {hasPosterMedia ? (
          <Media
            alt={work.title || ''}
            htmlElement={null}
            imgClassName="size-full object-cover"
            pictureClassName="block size-full"
            resource={media}
            size="130px"
          />
        ) : work.posterPath ? (
          <Image
            alt={work.title || ''}
            className="size-full object-cover"
            height={352}
            src={work.posterPath}
            width={259}
          />
        ) : null}
      </div>
      {work.title && (
        <h3 className="mt-5 type-body-m font-bold leading-[1.5] text-white">{work.title}</h3>
      )}
      {work.description && (
        <p className="mt-2 whitespace-pre-line type-label-m leading-[1.5] text-white/70">
          {formatMultilineText(work.description)}
        </p>
      )}
    </article>
  )
}

function formatMultilineText(value: string) {
  return value.replace(/<br\s*\/?>/gi, '\n').trim()
}
