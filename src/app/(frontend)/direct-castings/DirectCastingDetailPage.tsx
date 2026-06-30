import type { Metadata } from 'next'

import RichText from '@/components/RichText'
import { centers, type CenterSlug } from '@/lib/centers'
import type { DirectCasting } from '@/payload-types'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import {
  DetailBackLink,
  DetailContainer,
  DetailHeader,
  DetailPage,
  DetailPager,
} from '../_components/DetailLayout'
import {
  directCastingCompanyValues,
  getDirectCastingCompanyLabels,
} from './DirectCastingsArchive'

export async function generateDirectCastingStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'direct-castings',
      limit: 1000,
      overrideAccess: true,
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

    return result.docs.flatMap((casting) => {
      const visibleCenters = casting.centers ?? []

      return visibleCenters.flatMap((center) => {
        if (!casting.slug || !(center in centers)) {
          return []
        }

        return [{ directCastingSlug: casting.slug, slug: center }]
      })
    })
  } catch {
    return []
  }
}

export async function DirectCastingDetailPage({
  center,
  slug,
}: {
  center: CenterSlug
  slug: string
}) {
  const casting = await queryDirectCastingBySlug({ center, slug }).catch(() => null)

  if (!casting) {
    notFound()
  }

  const body = hasLexicalContent(casting.body) ? casting.body : undefined
  const companyValues = directCastingCompanyValues(casting.company)
  const primaryCompany = companyValues[0]
  const companyLabel = getDirectCastingCompanyLabels(casting.company).join(' · ')
  const backHref = directCastingBackHref({ center, company: primaryCompany })
  const backLabel = '다이렉트 캐스팅'
  const adjacent = await queryAdjacentDirectCastings({
    center,
    company: primaryCompany,
    slug: casting.slug,
  })

  return (
    <DetailPage center={center} className="page-direct-casting-detail">
      <DetailBackLink href={backHref} label={backLabel} width="wide" />

      <DetailContainer width="wide">
        <DetailHeader
          dateTime={casting.publishedAt ?? casting.createdAt}
          eyebrow={[companyLabel, casting.yearLabel].filter(Boolean).join(' · ')}
          title={casting.title}
        />

        <div className="section-direct-casting-detail__content">
          <div className="section-direct-casting-detail__body min-w-0">
            {body ? (
              <RichText
                className="[&_img]:mx-auto [&_picture]:mx-auto"
                data={body}
                enableGutter={false}
              />
            ) : (
              <p className="border-y border-border py-12 text-center type-title-s font-semibold text-muted-foreground">
                등록된 엔딩크레딧 내용이 없습니다.
              </p>
            )}
          </div>
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

export async function generateDirectCastingMetadata({
  center,
  slug,
}: {
  center: CenterSlug
  slug: string
}): Promise<Metadata> {
  const casting = await queryDirectCastingBySlug({ center, slug }).catch(() => null)

  return {
    description: casting?.projectInfo || undefined,
    title: casting?.title || '다이렉트 캐스팅',
  }
}

const queryDirectCastingBySlug = cache(
  async ({ center, slug }: { center: CenterSlug; slug: string }) => {
    const { isEnabled: draft } = await draftMode()
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'direct-castings',
      depth: 1,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          {
            slug: {
              equals: slug,
            },
          },
          {
            centers: {
              contains: center,
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

    return (result.docs?.[0] as DirectCasting | undefined) || null
  },
)

const queryAdjacentDirectCastings = cache(
  async ({
    center,
    company,
    slug,
  }: {
    center: CenterSlug
    company?: ReturnType<typeof directCastingCompanyValues>[number]
    slug: string
  }) => {
    const payload = await getPayload({ config: configPromise })
    const where: Where = {
      and: [
        {
          displayStatus: {
            equals: 'published',
          },
        },
        {
          centers: {
            contains: center,
          },
        },
        ...(company
          ? [
              {
                company: {
                  contains: company,
                },
              },
            ]
          : []),
      ],
    }
    const result = await payload
      .find({
        collection: 'direct-castings',
        depth: 0,
        limit: 1000,
        overrideAccess: true,
        pagination: false,
        select: {
          slug: true,
          title: true,
        },
        sort: '-publishedAt',
        where,
      })
      .catch(() => ({ docs: [] }))

    const index = result.docs.findIndex((item) => item.slug === slug)
    const previous = index >= 0 ? result.docs[index + 1] : undefined
    const next = index > 0 ? result.docs[index - 1] : undefined
    const pathPrefix = `/${center}/direct-castings`

    return {
      nextHref: next?.slug ? `${pathPrefix}/${encodeURIComponent(next.slug)}` : null,
      nextLabel: next?.title || '다음 다이렉트 캐스팅',
      previousHref: previous?.slug ? `${pathPrefix}/${encodeURIComponent(previous.slug)}` : null,
      previousLabel: previous?.title || '이전 다이렉트 캐스팅',
    }
  },
)

function directCastingBackHref({
  center,
  company,
}: {
  center: CenterSlug
  company?: ReturnType<typeof directCastingCompanyValues>[number]
}) {
  const params = new URLSearchParams()

  if (company) {
    params.set('company', company)
  }

  const query = params.toString()

  return `/${center}/direct-castings${query ? `?${query}` : ''}`
}

function hasLexicalContent(value: DirectCasting['body']) {
  const children = value?.root?.children

  return Array.isArray(children) && children.length > 0
}
