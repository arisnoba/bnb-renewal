import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import type { Metadata } from 'next'

import RichText from '@/components/RichText'
import type { CenterSlug } from '@/lib/centers'
import type { ExamPassedReview, ExamSchoolLogo } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getPayload } from 'payload'
import { cache } from 'react'

import {
  DetailBackLink,
  DetailContainer,
  DetailPage,
  DetailPager,
} from '../_components/DetailLayout'

type ExamPassedReviewDetail = ExamPassedReview & {
  school: number | (Pick<ExamSchoolLogo, 'id' | 'schoolName'> & Record<string, unknown>)
}

const center: CenterSlug = 'exam'
const pathPrefix = '/exam/passed-reviews'

export async function generateExamPassedReviewStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'exam-passed-reviews',
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
      where: {
        and: [
          {
            displayStatus: {
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

    return result.docs.flatMap(({ slug }) => (slug ? [{ reviewSlug: slug, slug: center }] : []))
  } catch {
    return []
  }
}

export async function ExamPassedReviewDetailPage({ slug }: { slug: string }) {
  const review = await queryExamPassedReviewBySlug(slug).catch(() => null)

  if (!review) {
    notFound()
  }

  const title = getReviewTitle(review)
  const resultSummary = normalizeText(review.resultSummary)
  const imageUrl = normalizeImageUrl(review.studentImagePath)
  const interviews = getInterviews(review)
  const body = hasLexicalContent(review.body) ? review.body : null
  const adjacent = await queryAdjacentExamPassedReviews(review.slug)

  return (
    <DetailPage center={center} className="page-exam-passed-review-detail">
      <DetailBackLink href={pathPrefix} label="수강생 합격후기" width="wide" />

      <DetailContainer width="wide">
        <header className="section-exam-passed-review-detail__header mb-10 md:mb-16">
          <h1 className="type-headline-l font-bold leading-[1.35] text-foreground md:type-headline-xl">
            {title}
          </h1>
        </header>

        <div className="section-exam-passed-review-detail__content grid gap-6 lg:grid-cols-[457px_minmax(0,1fr)] lg:items-start">
          <div className="section-exam-passed-review-detail__media relative aspect-[457/511] overflow-hidden bg-neutral-100">
            {imageUrl ? (
              <Image
                alt={`${review.studentName} 학생`}
                className="size-full object-cover"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 457px"
                src={imageUrl}
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center px-8 text-center type-label-l font-semibold text-neutral-500">
                이미지 준비중
              </div>
            )}
          </div>

          <aside className="section-exam-passed-review-detail__panel border border-neutral-300 bg-white p-6 md:p-8">
            <div className="section-exam-passed-review-detail__summary border-b border-neutral-200 pb-8">
              <h2 className="type-headline-m font-bold leading-[1.35] text-foreground">
                {review.studentName}
              </h2>
              {resultSummary ? (
                <p className="mt-2 type-title-s font-bold leading-normal text-foreground">
                  {resultSummary}
                </p>
              ) : null}
            </div>

            {interviews.length > 0 ? (
              <div className="section-exam-passed-review-detail__interviews mt-8 space-y-6">
                {interviews.map((item, index) => (
                  <section
                    className="section-exam-passed-review-detail__interview"
                    key={item.id ?? `${item.question}-${index}`}
                  >
                    <h3 className="flex items-start gap-2 type-title-s font-bold leading-normal text-foreground">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand type-caption-l font-semibold leading-none text-white">
                        Q
                      </span>
                      <span>{item.question}</span>
                    </h3>
                    <p className="mt-4 whitespace-pre-line type-body-m font-normal leading-[1.6] text-neutral-700">
                      {item.answer}
                    </p>
                  </section>
                ))}
              </div>
            ) : body ? (
              <RichText
                className="section-exam-passed-review-detail__body mt-8 type-body-s font-medium leading-[1.6] text-foreground [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-900 [&_blockquote]:pl-4 [&_h2]:type-title-l [&_h2]:font-bold [&_h3]:type-title-m [&_h3]:font-bold [&_hr]:my-6 [&_p]:my-4"
                data={body as DefaultTypedEditorState}
                enableGutter={false}
                enableProse={false}
              />
            ) : null}
          </aside>
        </div>
      </DetailContainer>

      <DetailPager
        nextHref={adjacent.nextHref}
        nextLabel="다음 글"
        previousHref={adjacent.previousHref}
        previousLabel="이전 글"
        width="wide"
      />
    </DetailPage>
  )
}

export async function generateExamPassedReviewMetadata(slug: string): Promise<Metadata> {
  const review = await queryExamPassedReviewBySlug(slug).catch(() => null)

  return {
    description: review ? getReviewDescription(review) : undefined,
    title: review ? getReviewTitle(review) : '수강생 합격후기',
  }
}

const queryExamPassedReviewBySlug = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'exam-passed-reviews',
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

  return (result.docs?.[0] as ExamPassedReviewDetail | undefined) || null
})

const queryAdjacentExamPassedReviews = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload
    .find({
      collection: 'exam-passed-reviews',
      depth: 0,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        resultSummary: true,
        slug: true,
        studentName: true,
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
  const previous = index >= 0 ? result.docs[index + 1] : undefined
  const next = index > 0 ? result.docs[index - 1] : undefined

  return {
    nextHref: next?.slug ? `${pathPrefix}/${encodeURIComponent(next.slug)}` : null,
    previousHref: previous?.slug ? `${pathPrefix}/${encodeURIComponent(previous.slug)}` : null,
  }
})

function getReviewTitle(review: Pick<ExamPassedReview, 'resultSummary' | 'studentName' | 'title'>) {
  return (
    normalizeText(review.title) ||
    [normalizeText(review.resultSummary), normalizeText(review.studentName)].filter(Boolean).join(' ') ||
    '수강생 합격후기'
  )
}

function getReviewDescription(review: Pick<ExamPassedReview, 'resultSummary' | 'studentName'>) {
  return [normalizeText(review.resultSummary), normalizeText(review.studentName)].filter(Boolean).join(' ')
}

function getInterviews(review: Pick<ExamPassedReview, 'interviews'>) {
  return (
    review.interviews
      ?.map((item) => ({
        answer: normalizeText(item.answer),
        id: item.id,
        question: normalizeText(item.question),
      }))
      .filter((item) => item.question && item.answer) ?? []
  )
}

function hasLexicalContent(data: ExamPassedReview['body']) {
  return Boolean(data?.root?.children?.length)
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
