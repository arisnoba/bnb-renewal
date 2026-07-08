import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import type { Metadata } from 'next'

import RichText from '@/components/RichText'
import type { CenterSlug } from '@/lib/centers'
import type { ExamResult } from '@/payload-types'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayload, type Payload, type Where } from 'payload'
import { cache } from 'react'

import {
  DetailBackLink,
  DetailContainer,
  DetailHeader,
  DetailPage,
  DetailPager,
} from '../_components/DetailLayout'
import { EXAM_DETAIL_STATIC_PARAMS_LIMIT } from '../staticGeneration'
import {
  getExamResultDetailHref,
  getExamResultPageTitle,
  getExamResultPathname,
  normalizeExamResultImageUrl,
  type ExamResultType,
} from './ExamResultsPage'

const center: CenterSlug = 'exam'

type ExamResultDetailParams = {
  resultType: ExamResultType
  slug: string
}

export async function generateExamResultStaticParams(resultType: ExamResultType) {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'exam-results',
      depth: 0,
      limit: EXAM_DETAIL_STATIC_PARAMS_LIMIT,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
      sort: '-publishedAt',
      where: publishedExamResultsWhere(resultType),
    })

    return result.docs.flatMap(({ id }) =>
      id ? [{ resultSlug: String(id), slug: center }] : [],
    )
  } catch {
    return []
  }
}

export async function ExamResultDetailPage({ resultType, slug }: ExamResultDetailParams) {
  const examResult = await queryExamResultBySlug({ resultType, slug }).catch(() => null)

  if (!examResult) {
    notFound()
  }

  const body = hasLexicalContent(examResult.body) ? examResult.body : null
  const thumbnailUrl = normalizeExamResultImageUrl(examResult.thumbnailPath)
  const backHref = getExamResultPathname(resultType)
  const backLabel = getExamResultPageTitle(resultType)
  const adjacent = await queryAdjacentExamResults({
    id: examResult.id,
    publishedAt: examResult.publishedAt,
    resultType,
  })

  return (
    <DetailPage center={center} className="page-exam-result-detail">
      <DetailBackLink href={backHref} label={backLabel} />

      <DetailContainer>
        <DetailHeader
          dateTime={examResult.publishedAt}
          eyebrow={backLabel}
          title={examResult.title}
        />

        {thumbnailUrl ? (
          <div className="section-exam-result-detail__thumbnail relative mb-10 aspect-270/268 w-full overflow-hidden rounded-xl bg-neutral-100 md:mb-14">
            <Image
              alt={examResult.title}
              className="size-full object-contain"
              fill
              priority
              sizes="(max-width: 839px) calc(100vw - 40px), 840px"
              src={thumbnailUrl}
              unoptimized
            />
          </div>
        ) : null}

        {body ? (
          <RichText
            className="[&_img]:mx-auto [&_picture]:mx-auto"
            data={body as DefaultTypedEditorState}
            enableGutter={false}
            linksOpenInNewTab
          />
        ) : null}
      </DetailContainer>

      <DetailPager
        listHref={backHref}
        listLabel={backLabel}
        nextHref={adjacent.nextHref}
        previousHref={adjacent.previousHref}
      />
    </DetailPage>
  )
}

export async function generateExamResultMetadata({
  resultType,
  slug,
}: ExamResultDetailParams): Promise<Metadata> {
  const examResult = await queryExamResultBySlug({ resultType, slug }).catch(() => null)
  const fallbackTitle = getExamResultPageTitle(resultType)
  const title = examResult?.title || fallbackTitle
  const description = examResult ? `${fallbackTitle} - ${examResult.title}` : undefined
  const imageUrl = examResult ? normalizeExamResultImageUrl(examResult.thumbnailPath) : ''
  const url = examResult
    ? getExamResultDetailHref({ id: examResult.id, resultType })
    : getExamResultPathname(resultType)

  return {
    description,
    openGraph: mergeOpenGraph(
      {
        description: description || '',
        images: imageUrl ? [{ url: imageUrl }] : undefined,
        title,
        url,
      },
      { center },
    ),
    title,
  }
}

const queryExamResultBySlug = cache(
  async ({ resultType, slug }: ExamResultDetailParams) => {
    const { isEnabled: draft } = await draftMode()
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'exam-results',
      depth: 1,
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
          publishedExamResultsWhere(resultType, { draft }),
        ],
      },
    })

    return (result.docs?.[0] as ExamResult | undefined) || null
  },
)

const queryAdjacentExamResults = cache(
  async ({
    id,
    publishedAt,
    resultType,
  }: {
    id: number
    publishedAt?: string | null
    resultType: ExamResultType
  }) => {
    const publishedAtValue = publishedAt?.trim()

    if (!publishedAtValue) {
      return {
        nextHref: null,
        previousHref: null,
      }
    }

    const payload = await getPayload({ config: configPromise })
    const [previous, next] = await Promise.all([
      queryAdjacentExamResultItem({
        direction: 'previous',
        id,
        payload,
        publishedAt: publishedAtValue,
        resultType,
      }),
      queryAdjacentExamResultItem({
        direction: 'next',
        id,
        payload,
        publishedAt: publishedAtValue,
        resultType,
      }),
    ])

    return {
      nextHref: next?.id ? getExamResultDetailHref({ id: next.id, resultType }) : null,
      previousHref: previous?.id
        ? getExamResultDetailHref({ id: previous.id, resultType })
        : null,
    }
  },
)

async function queryAdjacentExamResultItem({
  direction,
  id,
  payload,
  publishedAt,
  resultType,
}: {
  direction: 'next' | 'previous'
  id: number
  payload: Payload
  publishedAt: string
  resultType: ExamResultType
}) {
  const isNext = direction === 'next'
  const dateOperator = isNext ? 'greater_than' : 'less_than'
  const idOperator = isNext ? 'greater_than' : 'less_than'
  const result = await payload.find({
    collection: 'exam-results',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    sort: isNext ? ['publishedAt', 'id'] : ['-publishedAt', '-id'],
    where: {
      and: [
        publishedExamResultsWhere(resultType),
        {
          or: [
            {
              publishedAt: {
                [dateOperator]: publishedAt,
              },
            },
            {
              and: [
                {
                  publishedAt: {
                    equals: publishedAt,
                  },
                },
                {
                  id: {
                    [idOperator]: id,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  })

  return result.docs[0] as Pick<ExamResult, 'id'> | undefined
}

function publishedExamResultsWhere(
  resultType: ExamResultType,
  { draft = false }: { draft?: boolean } = {},
): Where {
  return {
    and: [
      ...(draft
        ? []
        : [
            {
              displayStatus: {
                equals: 'published',
              },
            },
          ]),
      {
        resultType: {
          equals: resultType,
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

function hasLexicalContent(value: ExamResult['body']) {
  const children = value?.root?.children

  return Array.isArray(children) && children.length > 0
}
