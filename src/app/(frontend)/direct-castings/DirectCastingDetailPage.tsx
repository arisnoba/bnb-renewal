import type { Metadata } from 'next'

import RichText from '@/components/RichText'
import type { CenterSlug } from '@/lib/centers'
import { centerPublicHref } from '@/lib/centerDomains'
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

export async function DirectCastingDetailPage({
  center,
  slug,
}: {
  center: CenterSlug
  slug: string
}) {
  const casting = await queryDirectCastingBySlug({ center, slug })

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
    id: casting.id,
    publishedAt: casting.publishedAt,
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
  const casting = await queryDirectCastingBySlug({ center, slug })

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
            id: {
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
    id,
    publishedAt,
  }: {
    center: CenterSlug
    company?: ReturnType<typeof directCastingCompanyValues>[number]
    id: number
    publishedAt?: string | null
  }) => {
    if (!publishedAt) {
      return {
        nextHref: null,
        nextLabel: '다음 다이렉트 캐스팅',
        previousHref: null,
        previousLabel: '이전 다이렉트 캐스팅',
      }
    }

    const payload = await getPayload({ config: configPromise })
    const publishedWhere: Where = {
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
    const [previous, next] = await Promise.all([
      queryAdjacentDirectCasting({
        direction: 'previous',
        id,
        payload,
        publishedAt,
        publishedWhere,
      }),
      queryAdjacentDirectCasting({
        direction: 'next',
        id,
        payload,
        publishedAt,
        publishedWhere,
      }),
    ])
    const pathPrefix = centerPublicHref(center, '/direct-castings')

    return {
      nextHref: next?.id ? `${pathPrefix}/${encodeURIComponent(String(next.id))}` : null,
      nextLabel: next?.title || '다음 다이렉트 캐스팅',
      previousHref: previous?.id ? `${pathPrefix}/${encodeURIComponent(String(previous.id))}` : null,
      previousLabel: previous?.title || '이전 다이렉트 캐스팅',
    }
  },
)

async function queryAdjacentDirectCasting({
  direction,
  id,
  payload,
  publishedAt,
  publishedWhere,
}: {
  direction: 'next' | 'previous'
  id: number
  payload: Awaited<ReturnType<typeof getPayload>>
  publishedAt: string
  publishedWhere: Where
}) {
  const isNext = direction === 'next'
  const operator = isNext ? 'greater_than' : 'less_than'
  const result = await payload.find({
    collection: 'direct-castings',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    select: { slug: true, title: true },
    sort: isNext ? ['publishedAt', 'id'] : ['-publishedAt', '-id'],
    where: {
      and: [
        publishedWhere,
        {
          or: [
            { publishedAt: { [operator]: publishedAt } },
            {
              and: [
                { publishedAt: { equals: publishedAt } },
                { id: { [operator]: id } },
              ],
            },
          ],
        },
      ],
    },
  })

  return result.docs[0]
}

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

  return centerPublicHref(center, `/direct-castings${query ? `?${query}` : ''}`)
}

function hasLexicalContent(value: DirectCasting['body']) {
  const children = value?.root?.children

  return Array.isArray(children) && children.length > 0
}
